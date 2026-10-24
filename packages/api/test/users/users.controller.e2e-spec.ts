/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { AuthModule } from '../../src/auth/auth.module';
import { AuthMiddleware } from '../../src/auth/auth.middleware';
import { ApiExceptionFilter } from '../../src/auth/api-exception.filter';
import { JwtService } from '../../src/auth/jwt.service';
import { Author } from '../../src/authors/entities/author.entity';
import { Book } from '../../src/books/entities/book.entity';
import { ApplicationValidationPipe } from '../../src/common/application-validation.pipe';
import { User, UserRole } from '../../src/users/entities/user.entity';
import { UsersModule } from '../../src/users/users.module';

const TEST_DB_NAME = 'watched_test';

const e2eDbConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || '127.0.0.1',
  port: +(process.env.DB_PORT || 5434),
  username: process.env.DB_USER || 'watched',
  password: process.env.DB_PASSWORD || 'watched',
  database: process.env.DB_NAME_TEST || TEST_DB_NAME,
  dropSchema: true,
  synchronize: true,
  autoLoadEntities: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot(e2eDbConfig),
    TypeOrmModule.forFeature([Book, Author]),
    AuthModule,
    UsersModule,
  ],
  providers: [AuthMiddleware],
})
class UsersControllerTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.ALL },
        { path: 'users/(.*)', method: RequestMethod.ALL },
      );
  }
}

type Violation = { field: string; error: string };

type ApiUser = {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  updatedAt: string;
};

const IDENTIFIER_REQUIRED = 'Username or email is required';
const USERNAME_FORMAT =
  'Username must contain 1 to 50 Latin letters, digits or underscores';
const EMAIL_FORMAT = 'Email must be a valid email address';
const ROLE_ENUM =
  'role must be one of the following values: ADMIN, USER, GUEST';
const BOTH_IDENTIFIERS_MISSING: Violation[] = [
  { field: 'username', error: IDENTIFIER_REQUIRED },
  { field: 'email', error: IDENTIFIER_REQUIRED },
];

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let usersRepository: Repository<User>;
  let jwtService: JwtService;
  let adminToken: string;
  let originalJwtSecret: string | undefined;
  let sequence = 0;

  const seedUser = (overrides: Partial<User> = {}): Promise<User> => {
    sequence += 1;

    return usersRepository.save(
      usersRepository.create({
        name: `Seed User ${sequence}`,
        username: `seed_${sequence}`,
        email: `seed${sequence}@test.dev`,
        passwordHash: 'hash',
        role: UserRole.USER,
        isActive: true,
        ...overrides,
      }),
    );
  };

  const patchUser = (
    identifier: string,
    body: Record<string, unknown>,
    token = adminToken,
  ) =>
    request(app.getHttpServer())
      .patch(`/users/${identifier}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const changeRole = (id: string, role: UserRole) =>
    request(app.getHttpServer())
      .patch(`/users/${id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role });

  const deactivate = (id: string) =>
    request(app.getHttpServer())
      .patch(`/users/${id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`);

  const waitForLockWaiters = async (count: number): Promise<void> => {
    const deadline = Date.now() + 5000;

    while (Date.now() < deadline) {
      const [{ waiting }] = await dataSource.query<{ waiting: number }[]>(
        `SELECT count(*)::int AS waiting FROM pg_stat_activity
         WHERE datname = current_database() AND wait_event_type = 'Lock'`,
      );

      if (waiting >= count) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    throw new Error(`Expected ${count} requests waiting for the row lock`);
  };

  // Holds the user row lock, queues the requests behind it in the given order and then releases it.
  const sendQueuedBehindRowLock = async (
    id: string,
    requests: request.Test[],
  ): Promise<request.Response[]> => {
    const queryRunner = dataSource.createQueryRunner();
    const responses: Promise<request.Response>[] = [];

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        'SELECT 1 FROM "user" WHERE "id" = $1 FOR UPDATE',
        [id],
      );

      for (const pending of requests) {
        responses.push(pending.then((response) => response));
        await waitForLockWaiters(responses.length);
      }
    } finally {
      await queryRunner.commitTransaction();
      await queryRunner.release();
    }

    return Promise.all(responses);
  };

  const fetchUser = async (id: string): Promise<ApiUser> => {
    const response = await request(app.getHttpServer())
      .get(`/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    return response.body as ApiUser;
  };

  const expectViolations = (
    response: request.Response,
    violations: Violation[],
  ): void => {
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      status: 422,
      message: violations[0].error,
      violations,
    });
  };

  beforeAll(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'users-controller-e2e-secret';

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture = await Test.createTestingModule({
      imports: [UsersControllerTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ApplicationValidationPipe());
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    dataSource = app.get(DataSource);
    usersRepository = dataSource.getRepository(User);
    jwtService = app.get(JwtService);
    adminToken = jwtService.generateToken(
      await seedUser({ role: UserRole.ADMIN }),
    );
  });

  afterAll(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await app?.close();
  });

  describe('PATCH /users/:identifier', () => {
    it('rejects clearing both identifiers and keeps the stored ones', async () => {
      const user = await seedUser();

      expectViolations(
        await patchUser(user.id, { username: null, email: '   ' }),
        BOTH_IDENTIFIERS_MISSING,
      );
      expect(await fetchUser(user.id)).toMatchObject({
        username: user.username,
        email: user.email,
      });
    });

    it('clears one identifier with null while the other remains', async () => {
      const user = await seedUser();

      const response = await patchUser(user.id, { username: null }).expect(200);
      expect(response.body).toMatchObject({
        username: null,
        email: user.email,
      });
    });

    it('rejects a name-only or role-only change while the stored username is invalid', async () => {
      const legacy = await seedUser({ username: 'legacy-user' });

      for (const body of [{ name: 'Only Name' }, { role: UserRole.GUEST }]) {
        expectViolations(await patchUser(legacy.id, body), [
          { field: 'username', error: USERNAME_FORMAT },
        ]);
      }
      expect(await fetchUser(legacy.id)).toMatchObject({
        name: legacy.name,
        role: UserRole.USER,
      });
    });

    it('accepts the change once the old username is fixed, or cleared while an email remains', async () => {
      const fixed = await seedUser({ username: 'legacy-fixed' });
      const fixedResponse = await patchUser(fixed.id, {
        name: 'Fixed Name',
        username: 'legacy_fixed',
      }).expect(200);
      expect(fixedResponse.body).toMatchObject({
        name: 'Fixed Name',
        username: 'legacy_fixed',
      });

      const cleared = await seedUser({ username: 'legacy-cleared' });
      const clearedResponse = await patchUser(cleared.id, {
        name: 'Cleared Name',
        username: null,
      }).expect(200);
      expect(clearedResponse.body).toMatchObject({
        name: 'Cleared Name',
        username: null,
        email: cleared.email,
      });
    });

    it('rejects null for name and role', async () => {
      const user = await seedUser();

      expectViolations(await patchUser(user.id, { name: null }), [
        { field: 'name', error: 'name must be a string' },
      ]);
      expectViolations(await patchUser(user.id, { role: null }), [
        { field: 'role', error: ROLE_ENUM },
      ]);
      expect(await fetchUser(user.id)).toMatchObject({
        name: user.name,
        role: UserRole.USER,
      });
    });

    it('checks the trimmed name length: 1 and 255 characters pass, blank and 256 fail', async () => {
      const user = await seedUser();

      const shortest = await patchUser(user.id, { name: '  N  ' }).expect(200);
      expect(shortest.body.name).toBe('N');

      const longest = await patchUser(user.id, {
        name: ` ${'n'.repeat(255)} `,
      }).expect(200);
      expect(longest.body.name).toBe('n'.repeat(255));

      expectViolations(await patchUser(user.id, { name: 'n'.repeat(256) }), [
        { field: 'name', error: 'Name must be at most 255 characters' },
      ]);
      expectViolations(await patchUser(user.id, { name: '   ' }), [
        { field: 'name', error: 'Name is required' },
      ]);
    });

    it('checks the trimmed username: 1 and 50 characters pass, 51 and other characters fail', async () => {
      const user = await seedUser();

      const shortest = await patchUser(user.id, { username: ' z ' }).expect(
        200,
      );
      expect(shortest.body.username).toBe('z');

      const longestUsername = `Patch_${'y'.repeat(43)}8`;
      const longest = await patchUser(user.id, {
        username: `  ${longestUsername}  `,
      }).expect(200);
      expect(longest.body.username).toBe(longestUsername);

      for (const username of [
        'p'.repeat(51),
        'with-hyphen',
        'with space',
        'dot.name',
        'кириллица',
        'at@sign.dev',
      ]) {
        expectViolations(await patchUser(user.id, { username }), [
          { field: 'username', error: USERNAME_FORMAT },
        ]);
      }
    });

    it('trims the email before checking its format and turns a blank email into null', async () => {
      const user = await seedUser();

      const trimmed = await patchUser(user.id, {
        email: '  Patched.Email@Test.dev  ',
      }).expect(200);
      expect(trimmed.body.email).toBe('Patched.Email@Test.dev');

      for (const email of [
        'not-an-email',
        'missing@tld',
        'two@@test.dev',
        'inner space@test.dev',
      ]) {
        expectViolations(await patchUser(user.id, { email }), [
          { field: 'email', error: EMAIL_FORMAT },
        ]);
      }

      const blank = await patchUser(user.id, { email: '   ' }).expect(200);
      expect(blank.body.email).toBeNull();
    });

    it('rejects non-string profile fields and unknown roles', async () => {
      const user = await seedUser();

      for (const [field, value] of [
        ['name', 42],
        ['username', 42],
        ['email', 42],
        ['email', true],
      ] as const) {
        expectViolations(await patchUser(user.id, { [field]: value }), [
          { field, error: `${field} must be a string` },
        ]);
      }

      for (const role of [42, 'OWNER']) {
        expectViolations(await patchUser(user.id, { role }), [
          { field: 'role', error: ROLE_ENUM },
        ]);
      }
    });

    it('writes an empty or unchanged PATCH and moves updatedAt', async () => {
      const user = await seedUser({
        name: 'Same Name',
        username: 'same_name',
        email: 'same@test.dev',
      });

      for (const body of [
        {},
        {
          name: '  Same Name  ',
          username: ' same_name ',
          email: 'same@test.dev ',
          role: UserRole.USER,
        },
      ]) {
        await dataSource.query(
          'UPDATE "user" SET "updatedAt" = $1 WHERE "id" = $2',
          ['2001-02-03 04:05:06', user.id],
        );
        const { updatedAt: previousUpdatedAt, ...unchanged } = await fetchUser(
          user.id,
        );

        const response = await patchUser(user.id, body).expect(200);
        const { updatedAt, ...after } = response.body as ApiUser;

        expect(after).toEqual(unchanged);
        expect(updatedAt).not.toBe(previousUpdatedAt);
      }
    });

    it('rejects an empty PATCH while the stored profile is invalid', async () => {
      const legacy = await seedUser({ username: 'still-legacy' });

      expectViolations(await patchUser(legacy.id, {}), [
        { field: 'username', error: USERNAME_FORMAT },
      ]);
    });

    it('writes nothing when one of the fields is rejected', async () => {
      const user = await seedUser();

      expectViolations(
        await patchUser(user.id, {
          name: 'Partial Name',
          username: 'bad-name',
        }),
        [{ field: 'username', error: USERNAME_FORMAT }],
      );
      expect(await fetchUser(user.id)).toMatchObject({
        name: user.name,
        username: user.username,
      });
    });

    it('maps a 23505 on the email index to 422 after rolling the write back', async () => {
      const user = await seedUser();
      const updateSpy = jest
        .spyOn(EntityManager.prototype, 'update')
        .mockRejectedValueOnce(
          new QueryFailedError(
            'UPDATE "user"',
            [],
            Object.assign(
              new Error(
                'duplicate key value violates unique constraint "user_email_lower_uq"',
              ),
              { code: '23505', constraint: 'user_email_lower_uq' },
            ),
          ),
        );

      try {
        expectViolations(
          await patchUser(user.id, {
            name: 'Rolled Back',
            email: 'raced@test.dev',
          }),
          [{ field: 'email', error: 'Email already exists' }],
        );
      } finally {
        updateSpy.mockRestore();
      }

      expect(await fetchUser(user.id)).toMatchObject({
        name: user.name,
        email: user.email,
      });
    });

    it("rejects a new email that matches another user's old username in any case", async () => {
      await seedUser({ username: 'Old.Login@Legacy.dev', email: null });
      const user = await seedUser();

      expectViolations(
        await patchUser(user.id, { email: 'old.login@legacy.DEV' }),
        [{ field: 'email', error: 'Email already exists' }],
      );
      expect((await fetchUser(user.id)).email).toBe(user.email);
    });

    it("accepts an email equal to the user's own old username while fixing it", async () => {
      const legacy = await seedUser({
        username: 'Self.Login@Legacy.dev',
        email: null,
      });

      const response = await patchUser(legacy.id, {
        username: 'self_login',
        email: 'self.login@legacy.dev',
      }).expect(200);
      expect(response.body).toMatchObject({
        username: 'self_login',
        email: 'self.login@legacy.dev',
      });
    });

    it('still forbids USER to edit, including their own profile', async () => {
      const user = await seedUser();

      await patchUser(
        user.id,
        { name: 'Self Edit' },
        jwtService.generateToken(user),
      ).expect(403);
      expect((await fetchUser(user.id)).name).toBe(user.name);
    });
  });

  describe('PATCH /users/:identifier/role and /users/:identifier/deactivate', () => {
    it('reject role change and deactivation until the stored profile is fixed', async () => {
      const legacy = await seedUser({ username: 'legacy-role-target' });

      expectViolations(await changeRole(legacy.id, UserRole.GUEST), [
        { field: 'username', error: USERNAME_FORMAT },
      ]);
      expectViolations(await deactivate(legacy.id), [
        { field: 'username', error: USERNAME_FORMAT },
      ]);
      expect(await fetchUser(legacy.id)).toMatchObject({
        role: UserRole.USER,
        isActive: true,
      });

      await patchUser(legacy.id, { username: 'legacy_role_target' }).expect(
        200,
      );

      const roleResponse = await changeRole(legacy.id, UserRole.GUEST).expect(
        200,
      );
      expect(roleResponse.body).toMatchObject({ role: UserRole.GUEST });

      const deactivateResponse = await deactivate(legacy.id).expect(200);
      expect(deactivateResponse.body).toMatchObject({
        isActive: false,
        role: UserRole.GUEST,
      });
    });
  });

  describe('concurrent edits of one user', () => {
    it('keeps the changes of different fields from parallel PATCH requests', async () => {
      const user = await seedUser();

      const [nameResponse, emailResponse] = await sendQueuedBehindRowLock(
        user.id,
        [
          patchUser(user.id, { name: 'Parallel Name' }),
          patchUser(user.id, { email: 'parallel@test.dev' }),
        ],
      );

      expect(nameResponse.status).toBe(200);
      expect(emailResponse.status).toBe(200);
      expect(emailResponse.body).toMatchObject({
        name: 'Parallel Name',
        email: 'parallel@test.dev',
      });
      expect(await fetchUser(user.id)).toMatchObject({
        name: 'Parallel Name',
        email: 'parallel@test.dev',
      });
    });

    it('keeps one identifier when parallel requests clear username and email', async () => {
      const user = await seedUser();

      const [usernameResponse, emailResponse] = await sendQueuedBehindRowLock(
        user.id,
        [
          patchUser(user.id, { username: null }),
          patchUser(user.id, { email: null }),
        ],
      );

      expect(usernameResponse.status).toBe(200);
      expectViolations(emailResponse, BOTH_IDENTIFIERS_MISSING);
      expect(await fetchUser(user.id)).toMatchObject({
        username: null,
        email: user.email,
      });
    });

    it('keeps a name change and a parallel role change', async () => {
      const user = await seedUser();

      const responses = await sendQueuedBehindRowLock(user.id, [
        patchUser(user.id, { name: 'Renamed Before Role Change' }),
        changeRole(user.id, UserRole.GUEST),
      ]);

      expect(responses.map(({ status }) => status)).toEqual([200, 200]);
      expect(await fetchUser(user.id)).toMatchObject({
        name: 'Renamed Before Role Change',
        role: UserRole.GUEST,
      });
    });

    it('keeps a deactivation and a parallel name change', async () => {
      const user = await seedUser();

      const responses = await sendQueuedBehindRowLock(user.id, [
        deactivate(user.id),
        patchUser(user.id, { name: 'Renamed After Deactivation' }),
      ]);

      expect(responses.map(({ status }) => status)).toEqual([200, 200]);
      expect(await fetchUser(user.id)).toMatchObject({
        name: 'Renamed After Deactivation',
        isActive: false,
      });
    });
  });
});
