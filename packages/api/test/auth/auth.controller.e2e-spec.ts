/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AuthModule } from '../../src/auth/auth.module';
import { ApiExceptionFilter } from '../../src/auth/api-exception.filter';
import { ApplicationValidationPipe } from '../../src/common/application-validation.pipe';
import { User, UserRole } from '../../src/users/entities/user.entity';

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

type Violation = { field: string; error: string };

const IDENTIFIER_REQUIRED = 'Username or email is required';
const USERNAME_FORMAT =
  'Username must contain 1 to 50 Latin letters, digits or underscores';
const EMAIL_FORMAT = 'Email must be a valid email address';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let originalJwtSecret: string | undefined;
  let sequence = 0;

  const register = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/auth/register').send(body);

  const validBody = (overrides: Record<string, unknown> = {}) => {
    sequence += 1;

    return {
      name: 'Valid User',
      username: `user_${sequence}`,
      email: `user${sequence}@test.dev`,
      password: 'password123',
      ...overrides,
    };
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
    process.env.JWT_SECRET = 'auth-controller-e2e-secret';

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(e2eDbConfig), AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ApplicationValidationPipe());
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await app?.close();
  });

  describe('POST /auth/register', () => {
    it('rejects registration without username and email with violations on both fields', async () => {
      const bothMissing = [
        { field: 'username', error: IDENTIFIER_REQUIRED },
        { field: 'email', error: IDENTIFIER_REQUIRED },
      ];

      expectViolations(
        await register({ name: 'No Identifiers', password: 'password123' }),
        bothMissing,
      );
      expectViolations(
        await register({
          name: 'Blank Identifiers',
          username: '   ',
          email: '',
          password: 'password123',
        }),
        bothMissing,
      );
    });

    it('registers with only a username or only an email', async () => {
      const byUsername = await register({
        name: 'Only Username',
        username: 'only_username',
        password: 'password123',
      }).expect(201);
      expect(byUsername.body.user).toMatchObject({
        username: 'only_username',
        email: null,
      });

      const byEmail = await register({
        name: 'Only Email',
        email: 'only-email@test.dev',
        password: 'password123',
      }).expect(201);
      expect(byEmail.body.user).toMatchObject({
        username: null,
        email: 'only-email@test.dev',
      });
    });

    it('checks the trimmed name length: 1 and 255 characters pass, blank and 256 fail', async () => {
      const shortest = await register(validBody({ name: '  N  ' })).expect(201);
      expect(shortest.body.user.name).toBe('N');

      const longest = await register(
        validBody({ name: ` ${'n'.repeat(255)} ` }),
      ).expect(201);
      expect(longest.body.user.name).toBe('n'.repeat(255));

      expectViolations(await register(validBody({ name: 'n'.repeat(256) })), [
        { field: 'name', error: 'Name must be at most 255 characters' },
      ]);
      expectViolations(await register(validBody({ name: '   ' })), [
        { field: 'name', error: 'Name is required' },
      ]);
    });

    it('rejects null and non-string names', async () => {
      for (const name of [null, 42]) {
        expectViolations(await register(validBody({ name })), [
          { field: 'name', error: 'name must be a string' },
        ]);
      }
    });

    it('checks the trimmed username: 1 and 50 characters pass, 51 and other characters fail', async () => {
      const shortest = await register(validBody({ username: ' q ' })).expect(
        201,
      );
      expect(shortest.body.user.username).toBe('q');

      const longestUsername = `Long_${'x'.repeat(44)}9`;
      const longest = await register(
        validBody({ username: `  ${longestUsername}  ` }),
      ).expect(201);
      expect(longest.body.user.username).toBe(longestUsername);

      for (const username of [
        'u'.repeat(51),
        'with-hyphen',
        'with space',
        'dot.name',
        'кириллица',
        'at@sign.dev',
      ]) {
        expectViolations(await register(validBody({ username })), [
          { field: 'username', error: USERNAME_FORMAT },
        ]);
      }
    });

    it('treats a blank or null username as absent and rejects non-string usernames', async () => {
      for (const username of ['   ', null]) {
        const response = await register(validBody({ username })).expect(201);
        expect(response.body.user.username).toBeNull();
      }

      expectViolations(await register(validBody({ username: 42 })), [
        { field: 'username', error: 'username must be a string' },
      ]);
    });

    it('trims the email before checking its format and rejects invalid emails', async () => {
      const trimmed = await register(
        validBody({ email: '  Trimmed.Email@Test.dev  ' }),
      ).expect(201);
      expect(trimmed.body.user.email).toBe('Trimmed.Email@Test.dev');

      for (const email of [
        'not-an-email',
        'missing@tld',
        'two@@test.dev',
        'inner space@test.dev',
      ]) {
        expectViolations(await register(validBody({ email })), [
          { field: 'email', error: EMAIL_FORMAT },
        ]);
      }
    });

    it('treats a blank or null email as absent and rejects non-string emails', async () => {
      for (const email of ['   ', null]) {
        const response = await register(validBody({ email })).expect(201);
        expect(response.body.user.email).toBeNull();
      }

      for (const email of [42, true]) {
        expectViolations(await register(validBody({ email })), [
          { field: 'email', error: 'email must be a string' },
        ]);
      }
    });

    it("rejects an email that matches another user's old username in any case", async () => {
      await dataSource.getRepository(User).save({
        name: 'Legacy Login',
        username: 'Legacy.Login@Old.dev',
        email: null,
        passwordHash: 'hash',
        role: UserRole.USER,
        isActive: true,
      });

      expectViolations(
        await register(validBody({ email: 'legacy.login@old.DEV' })),
        [{ field: 'email', error: 'Email already exists' }],
      );
    });

    it('keeps the password exactly as sent', async () => {
      const body = validBody({ password: '  pass word  ' });
      const login = (password: string) =>
        request(app.getHttpServer())
          .post('/auth/login')
          .send({ identifier: body.username, password });

      await register(body).expect(201);

      await login('  pass word  ').expect(200);
      await login('pass word').expect(401);
    });

    it('reports a blank password together with profile violations', async () => {
      expectViolations(
        await register(validBody({ name: ' ', password: '      ' })),
        [
          { field: 'name', error: 'Name is required' },
          { field: 'password', error: 'Password is required' },
        ],
      );
    });

    it('rejects null and non-string passwords', async () => {
      for (const password of [null, 12345678]) {
        const response = await register(validBody({ password }));

        expect(response.status).toBe(422);
        expect(response.body.violations).toEqual(
          expect.arrayContaining([
            { field: 'password', error: 'password must be a string' },
          ]),
        );
      }
    });
  });
});
