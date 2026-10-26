/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  INestApplication,
  Controller,
  Get,
  MiddlewareConsumer,
  Module,
  NestModule,
  Post,
  RequestMethod,
  ValidationPipe,
  Delete,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, QueryFailedError } from 'typeorm';
import { AuthModule } from '../../src/auth/auth.module';
import { ApiExceptionFilter } from '../../src/auth/api-exception.filter';
import { ApplicationValidationPipe } from '../../src/common/application-validation.pipe';
import { User, UserRole } from '../../src/users/entities/user.entity';
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { UserListsModule } from '../../src/user-lists/user-lists.module';
import { UsersModule } from '../../src/users/users.module';
import { AuthMiddleware } from '../../src/auth/auth.middleware';
import { AdminMiddleware } from '../../src/auth/admin.middleware';
import { JwtService } from '../../src/auth/jwt.service';
import { UserBook } from '../../src/user-lists/entities/user-book.entity';
import { Book } from '../../src/books/entities/book.entity';
import { BooksModule } from '../../src/books/books.module';
import { AuthorsModule } from '../../src/authors/authors.module';
import { DirectorsModule } from '../../src/directors/directors.module';
import { APP_FILTER } from '@nestjs/core';
import type { JwtPayload } from '../../src/auth/auth.types';

const TEST_DB_NAME = 'watched_test';

const e2eDbConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || '127.0.0.1',
  port: +(process.env.DB_PORT || 33021),
  username: process.env.DB_USER || 'watched',
  password: process.env.DB_PASSWORD || 'watched',
  database: process.env.DB_NAME_TEST || TEST_DB_NAME,
  dropSchema: true,
  synchronize: true,
  autoLoadEntities: true,
};

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
    violations: Record<string, string>,
  ): void => {
    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      status: 422,
      message: Object.values(violations)[0],
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
      const bothMissing = {
        username: IDENTIFIER_REQUIRED,
        email: IDENTIFIER_REQUIRED,
      };

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

      expectViolations(await register(validBody({ name: 'n'.repeat(256) })), {
        name: 'Name must be at most 255 characters',
      });
      expectViolations(await register(validBody({ name: '   ' })), {
        name: 'Name is required',
      });
    });

    it('rejects null and non-string names', async () => {
      for (const name of [null, 42]) {
        expectViolations(await register(validBody({ name })), {
          name: 'name must be a string',
        });
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
        expectViolations(await register(validBody({ username })), {
          username: USERNAME_FORMAT,
        });
      }
    });

    it('treats a blank or null username as absent and rejects non-string usernames', async () => {
      for (const username of ['   ', null]) {
        const response = await register(validBody({ username })).expect(201);
        expect(response.body.user.username).toBeNull();
      }

      expectViolations(await register(validBody({ username: 42 })), {
        username: 'username must be a string',
      });
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
        expectViolations(await register(validBody({ email })), {
          email: EMAIL_FORMAT,
        });
      }
    });

    it('treats a blank or null email as absent and rejects non-string emails', async () => {
      for (const email of ['   ', null]) {
        const response = await register(validBody({ email })).expect(201);
        expect(response.body.user.email).toBeNull();
      }

      for (const email of [42, true]) {
        expectViolations(await register(validBody({ email })), {
          email: 'email must be a string',
        });
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
        { email: 'Email already exists' },
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
        { name: 'Name is required', password: 'Password is required' },
      );
    });

    it('keeps the first validation message when a password violates multiple constraints', async () => {
      for (const password of [null, 12345678]) {
        const response = await register(validBody({ password }));

        expect(response.status).toBe(422);
        expect(response.body).toEqual({
          status: 422,
          message: 'password must be longer than or equal to 6 characters',
          violations: {
            password: 'password must be longer than or equal to 6 characters',
          },
        });
      }
    });
  });

  describe('POST /auth/login', () => {
    const login = (identifier: unknown, password = 'password123') =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier, password });

    it('does not log in by the display name', async () => {
      const body = validBody({ name: `Display Name ${sequence}` });
      await register(body).expect(201);

      const response = await login(body.name).expect(401);
      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body.token).toBeUndefined();
    });

    it("checks the password of the username owner when another user's name matches it", async () => {
      const owner = validBody();
      await register(owner).expect(201);
      await register(
        validBody({ name: owner.username, password: 'other-password' }),
      ).expect(201);

      await login(owner.username, 'other-password').expect(401);
      await login(owner.username).expect(200);
    });

    it('rejects a blank identifier and one matching different users', async () => {
      await login(' \t ').expect(401);

      const shared = 'Shared.Login@Test.dev';
      const hash = 'hash';
      await dataSource.getRepository(User).save(
        [
          { name: 'A', username: shared, email: null, passwordHash: hash },
          {
            name: 'B',
            username: null,
            email: shared.toLowerCase(),
            passwordHash: hash,
          },
        ].map((user) => ({ ...user, role: UserRole.USER, isActive: true })),
      );

      const response = await login(` ${shared} `).expect(401);
      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body.token).toBeUndefined();
    });
  });
});

@Controller()
class CatalogStubController {
  @Get('books')
  getBooks(): [] {
    return [];
  }

  @Post('books')
  createBook(): { id: string } {
    return { id: randomUUID() };
  }

  @Get('movies')
  getMovies(): [] {
    return [];
  }

  @Get('series')
  getSeries(): [] {
    return [];
  }

  @Get('games')
  getGames(): [] {
    return [];
  }

  @Post('games')
  createGame(): { id: string } {
    return { id: randomUUID() };
  }

  @Get('authors')
  getAuthors(): [] {
    return [];
  }

  @Get('directors')
  getDirectors(): [] {
    return [];
  }
}

const USER_OWNER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_ID = '33333333-3333-4333-8333-333333333333';
const GUEST_ID = '44444444-4444-4444-8444-444444444444';
const INACTIVE_USER_ID = '55555555-5555-4555-8555-555555555555';

@Module({
  imports: [
    TypeOrmModule.forRoot(e2eDbConfig),
    TypeOrmModule.forFeature([BooksModule, AuthorsModule]),
    AuthModule,
    UsersModule,
    DirectorsModule,
    UserListsModule,
  ],
  controllers: [CatalogStubController],
  providers: [
    JwtService,
    AuthMiddleware,
    AdminMiddleware,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
class Step7FinalTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'auth/me', method: RequestMethod.GET },
        { path: 'users', method: RequestMethod.ALL },
        { path: 'users/(.*)', method: RequestMethod.ALL },
        { path: 'books', method: RequestMethod.GET },
        { path: 'books/(.*)', method: RequestMethod.GET },
        { path: 'movies', method: RequestMethod.GET },
        { path: 'movies/(.*)', method: RequestMethod.GET },
        { path: 'series', method: RequestMethod.GET },
        { path: 'series/(.*)', method: RequestMethod.GET },
        { path: 'games', method: RequestMethod.GET },
        { path: 'games/(.*)', method: RequestMethod.GET },
        { path: 'authors', method: RequestMethod.GET },
        { path: 'authors/(.*)', method: RequestMethod.GET },
        { path: 'directors', method: RequestMethod.GET },
        { path: 'directors/(.*)', method: RequestMethod.GET },
        { path: 'publishers', method: RequestMethod.GET },
        { path: 'publishers/(.*)', method: RequestMethod.GET },
        { path: 'developers', method: RequestMethod.GET },
        { path: 'developers/(.*)', method: RequestMethod.GET },
        { path: 'user-books', method: RequestMethod.ALL },
        { path: 'user-books/(.*)', method: RequestMethod.ALL },
        { path: 'user-games', method: RequestMethod.ALL },
        { path: 'user-games/(.*)', method: RequestMethod.ALL },
      );

    consumer
      .apply(AuthMiddleware, AdminMiddleware)
      .forRoutes(
        { path: 'books', method: RequestMethod.POST },
        { path: 'books/:id', method: RequestMethod.PUT },
        { path: 'books/:id', method: RequestMethod.DELETE },
        { path: 'games', method: RequestMethod.POST },
        { path: 'games/:id', method: RequestMethod.PUT },
        { path: 'games/:id', method: RequestMethod.DELETE },
      );
  }
}

describe('Step 7 final authorization integration (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let originalJwtSecret: string | undefined;

  const signToken = (
    role: UserRole,
    userId: string,
    expiresIn: SignOptions['expiresIn'] = '24h',
  ): string => {
    return jwt.sign(
      {
        userId,
        username: `${role.toLowerCase()}-user`,
        name: `${role} User`,
        role,
      },
      process.env.JWT_SECRET as string,
      {
        algorithm: 'HS256',
        expiresIn,
      },
    );
  };

  const expectInvalidCredentials = (response: request.Response): void => {
    expect(response.body).toEqual({
      status: 401,
      message: 'Invalid credentials',
      violations: {},
    });
  };

  const createBookId = async (): Promise<string> => {
    const booksRepository = dataSource.getRepository(Book);
    const book = await booksRepository.save({
      title: `auth-e2e-book-${Date.now()}-${randomUUID()}`,
    });

    return book.id;
  };

  beforeAll(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'step7-final-secret';

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [Step7FinalTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        errorHttpStatusCode: 422,
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());

    await app.init();
    dataSource = app.get(DataSource);

    await dataSource.getRepository(User).save([
      {
        id: USER_OWNER_ID,
        name: 'Owner User',
        username: 'owner-user',
        email: 'owner@test.dev',
        passwordHash: 'hash',
        role: UserRole.USER,
        isActive: true,
      },
      {
        id: OTHER_USER_ID,
        name: 'Other User',
        username: 'other-user',
        email: 'other@test.dev',
        passwordHash: 'hash',
        role: UserRole.USER,
        isActive: true,
      },
      {
        id: ADMIN_ID,
        name: 'Admin User',
        username: 'admin-user',
        email: 'admin@test.dev',
        passwordHash: 'hash',
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        id: GUEST_ID,
        name: 'Guest User',
        username: 'guest-user',
        email: 'guest@test.dev',
        passwordHash: 'hash',
        role: UserRole.GUEST,
        isActive: true,
      },
      {
        id: INACTIVE_USER_ID,
        name: 'Inactive User',
        username: 'inactive-user',
        email: 'inactive@test.dev',
        passwordHash: 'hash',
        role: UserRole.USER,
        isActive: false,
      },
    ]);
  });

  afterAll(async () => {
    process.env.JWT_SECRET = originalJwtSecret;

    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    if (app) {
      await app.close();
    }
  });

  it('enforces role matrix and preserves data on forbidden mutations', async () => {
    const userToken = signToken(UserRole.USER, USER_OWNER_ID);
    const otherUserToken = signToken(UserRole.USER, OTHER_USER_ID);
    const adminToken = signToken(UserRole.ADMIN, ADMIN_ID);
    const guestToken = signToken(UserRole.GUEST, GUEST_ID);

    const userBooksRepository = dataSource.getRepository(UserBook);
    const bookId = await createBookId();

    const foreignEntry = await userBooksRepository.save({
      userId: OTHER_USER_ID,
      bookId,
      rating: 10,
      comment: 'foreign-original',
    });

    await request(app.getHttpServer())
      .put(`/user-books/${foreignEntry.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ comment: 'forbidden-edit' })
      .expect(403);

    const unchangedForeign = await userBooksRepository.findOneOrFail({
      where: { id: foreignEntry.id },
    });
    expect(unchangedForeign.comment).toBe('foreign-original');

    await request(app.getHttpServer())
      .put(`/user-books/${foreignEntry.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ comment: 'admin-edit' })
      .expect(200);

    const ownEntry = await userBooksRepository.save({
      userId: USER_OWNER_ID,
      bookId: await createBookId(),
      rating: 40,
      comment: 'owner-entry',
    });

    await request(app.getHttpServer())
      .post('/user-books')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ bookId: randomUUID(), rating: 20 })
      .expect(403);

    await request(app.getHttpServer())
      .put(`/user-books/${ownEntry.id}`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ rating: 20 })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/user-books/${ownEntry.id}`)
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .put(`/user-books/${ownEntry.id}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ userId: OTHER_USER_ID, rating: 50 })
      .expect(403);

    const unchangedOwn = await userBooksRepository.findOneOrFail({
      where: { id: ownEntry.id },
    });
    expect(unchangedOwn.rating).toBe(40);
  });

  it('returns correct auth errors for missing, invalid and expired token on protected routes', async () => {
    await request(app.getHttpServer())
      .post('/user-books')
      .send({ bookId: randomUUID() })
      .expect(401)
      .expect((response) => {
        expect(response.body).toEqual({
          status: 401,
          message: 'Authorization token required',
          violations: {},
        });
      });

    await request(app.getHttpServer())
      .post('/user-books')
      .set('Authorization', 'Bearer invalid-token')
      .send({ bookId: randomUUID() })
      .expect(401)
      .expect((response) => {
        expect(response.body).toEqual({
          status: 401,
          message: 'Invalid token',
          violations: {},
        });
      });

    const expiredToken = signToken(UserRole.USER, USER_OWNER_ID, '-1h');
    await request(app.getHttpServer())
      .post('/user-books')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({ bookId: randomUUID() })
      .expect(401)
      .expect((response) => {
        expect(response.body).toEqual({
          status: 401,
          message: 'Token expired',
          violations: {},
        });
      });
  });

  it('rejects valid JWT whose user is missing, inactive or has malformed UUID with 401', async () => {
    const deletedUserToken = signToken(UserRole.USER, randomUUID());
    await request(app.getHttpServer())
      .get('/books')
      .set('Authorization', `Bearer ${deletedUserToken}`)
      .expect(401);

    const inactiveToken = signToken(UserRole.USER, INACTIVE_USER_ID);
    await request(app.getHttpServer())
      .get('/books')
      .set('Authorization', `Bearer ${inactiveToken}`)
      .expect(401);

    const malformedIdToken = signToken(UserRole.USER, 'not-a-uuid');
    await request(app.getHttpServer())
      .get('/books')
      .set('Authorization', `Bearer ${malformedIdToken}`)
      .expect(401);
  });

  it('applies the role stored in DB instead of the role claimed by JWT', async () => {
    const forgedAdminToken = signToken(UserRole.ADMIN, USER_OWNER_ID);
    await request(app.getHttpServer())
      .post('/books')
      .set('Authorization', `Bearer ${forgedAdminToken}`)
      .send({ title: 'forged-admin-book' })
      .expect(403);

    const staleUserToken = signToken(UserRole.USER, ADMIN_ID);
    await request(app.getHttpServer())
      .post('/books')
      .set('Authorization', `Bearer ${staleUserToken}`)
      .send({ title: 'promoted-admin-book' })
      .expect(201);
  });

  it('reports DB failure during user lookup as server error, not as 401/403', async () => {
    const findOneSpy = jest
      .spyOn(dataSource.getRepository(User), 'findOne')
      .mockRejectedValueOnce(new Error('connection refused'));

    try {
      await request(app.getHttpServer())
        .get('/books')
        .set(
          'Authorization',
          `Bearer ${signToken(UserRole.USER, USER_OWNER_ID)}`,
        )
        .expect(500)
        .expect((response) => {
          expect(response.body).toEqual({
            status: 500,
            message: 'Internal server error',
            violations: {},
          });
        });
    } finally {
      findOneSpy.mockRestore();
    }
  });

  it('catalog GET endpoints require auth (no public catalog)', async () => {
    const catalogRoutes = [
      '/books',
      '/movies',
      '/series',
      '/games',
      '/authors',
      '/directors',
      '/publishers',
      '/developers',
    ];
    for (const route of catalogRoutes) {
      await request(app.getHttpServer()).get(route).expect(401);
    }
  });

  it('keeps public /user/:guid/books scoped to requested guid', async () => {
    const userBooksRepository = dataSource.getRepository(UserBook);
    const sharedBookId = await createBookId();

    await userBooksRepository.save([
      {
        userId: USER_OWNER_ID,
        bookId: sharedBookId,
        comment: 'owner-visible',
      },
      {
        userId: OTHER_USER_ID,
        bookId: sharedBookId,
        comment: 'must-not-leak',
      },
    ]);

    const response = await request(app.getHttpServer())
      .get(`/user/${USER_OWNER_ID}/books`)
      .expect(200);

    const entries = response.body as Array<{ userId: string }>;
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.userId === USER_OWNER_ID)).toBe(true);
  });

  it('covers duplicate registration, login failures, identifier trim, and inactive users in /users', async () => {
    const suffix = Date.now();

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Duplicate First',
        username: `duplicate_${suffix}`,
        password: 'password123',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Duplicate Second',
        username: `duplicate_${suffix}`,
        password: 'password123',
      })
      .expect(422)
      .expect((response) => {
        expect(response.body).toEqual({
          status: 422,
          message: 'Username already exists',
          violations: { username: 'Username already exists' },
        });
      });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: `duplicate_${suffix}`,
        password: 'wrong-password',
      })
      .expect(401)
      .expect(expectInvalidCredentials);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: `missing-${suffix}`,
        password: 'password123',
      })
      .expect(401)
      .expect(expectInvalidCredentials);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Trim User',
        username: `trim_${suffix}`,
        password: 'password123',
      })
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: `   trim_${suffix}   `,
        password: 'password123',
      })
      .expect(200);

    const usersResponse = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${loginResponse.body.token as string}`)
      .expect(200);

    const users = usersResponse.body as Array<{
      id: string;
      passwordHash?: string;
    }>;

    expect(users.some((user) => user.id === INACTIVE_USER_ID)).toBe(false);
    expect(users.every((user) => user.passwordHash === undefined)).toBe(true);
  });

  it("rejects registration with another user's username or email in a different case", async () => {
    const suffix = `${Date.now()}_${randomUUID().slice(0, 8)}`;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Case Owner',
        username: `Case_Owner_${suffix}`,
        email: `Case.Owner-${suffix}@Test.dev`,
        password: 'password123',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Username Clash',
        username: `case_owner_${suffix}`,
        password: 'password123',
      })
      .expect(422)
      .expect((response) => {
        expect(response.body).toEqual({
          status: 422,
          message: 'Username already exists',
          violations: { username: 'Username already exists' },
        });
      });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Email Clash',
        email: `CASE.OWNER-${suffix}@test.dev`,
        password: 'password123',
      })
      .expect(422)
      .expect((response) => {
        expect(response.body).toEqual({
          status: 422,
          message: 'Email already exists',
          violations: { email: 'Email already exists' },
        });
      });
  });

  describe('register when the database rejects the insert', () => {
    const registerWithInsertFailure = async (
      code: string,
      constraint: string,
      message: string,
    ): Promise<request.Response> => {
      const suffix = `${Date.now()}_${randomUUID().slice(0, 8)}`;
      const saveSpy = jest
        .spyOn(dataSource.getRepository(User), 'save')
        .mockRejectedValueOnce(
          new QueryFailedError(
            'INSERT INTO "user"',
            [],
            Object.assign(new Error(message), { code, constraint }),
          ),
        );

      try {
        return await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            name: 'Insert Failure',
            username: `fail_${suffix}`,
            email: `fail-${suffix}@test.dev`,
            password: 'password123',
          });
      } finally {
        saveSpy.mockRestore();
      }
    };

    it('maps a 23505 on the username index to 422 for username', async () => {
      const response = await registerWithInsertFailure(
        '23505',
        'user_username_lower_uq',
        'duplicate key value violates unique constraint "user_username_lower_uq"',
      );

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        status: 422,
        message: 'Username already exists',
        violations: { username: 'Username already exists' },
      });
    });

    it('maps a 23505 on the email index to 422 for email', async () => {
      const response = await registerWithInsertFailure(
        '23505',
        'user_email_lower_uq',
        'duplicate key value violates unique constraint "user_email_lower_uq"',
      );

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        status: 422,
        message: 'Email already exists',
        violations: { email: 'Email already exists' },
      });
    });

    it('does not mask a 23505 on an unknown constraint', async () => {
      const response = await registerWithInsertFailure(
        '23505',
        'user_pkey',
        'duplicate key value violates unique constraint "user_pkey"',
      );

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 500,
        message: 'Internal server error',
        violations: {},
      });
    });

    it('does not mask another error code on a known index', async () => {
      const response = await registerWithInsertFailure(
        '23514',
        'user_username_lower_uq',
        'new row for relation "user" violates check constraint "user_username_lower_uq"',
      );

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        status: 500,
        message: 'Internal server error',
        violations: {},
      });
    });
  });

  it('logs in by username or email in a different case into the same account', async () => {
    const suffix = `${Date.now()}_${randomUUID().slice(0, 8)}`;
    const username = `Case_Login_${suffix}`;

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Case Login',
        username,
        email: `Case.Login-${suffix}@Test.dev`,
        password: 'password123',
      })
      .expect(201);
    const userId = registerResponse.body.user.id as string;

    const byUsername = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: `CASE_LOGIN_${suffix}`, password: 'password123' })
      .expect(200);
    expect(byUsername.body.user.id).toBe(userId);
    expect(byUsername.body.user.username).toBe(username);

    const byEmail = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        identifier: `case.login-${suffix}@test.dev`,
        password: 'password123',
      })
      .expect(200);
    expect(byEmail.body.user.id).toBe(userId);
  });

  it('denies login to inactive users without revealing inactivity on wrong password', async () => {
    const suffix = `${Date.now()}_${randomUUID().slice(0, 8)}`;
    const username = `inactive_login_${suffix}`;
    const password = 'password123';
    const adminToken = signToken(UserRole.ADMIN, ADMIN_ID);

    const login = (identifier: string, loginPassword: string) =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ identifier, password: loginPassword });

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Inactive Login User', username, password })
      .expect(201);
    const userId = registerResponse.body.user.id as string;

    const activeLogin = await login(username, password).expect(200);
    expect(typeof activeLogin.body.token).toBe('string');
    expect(activeLogin.body.user.id).toBe(userId);

    await login(username, 'wrong-password')
      .expect(401)
      .expect(expectInvalidCredentials);

    await request(app.getHttpServer())
      .patch(`/users/${userId}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await login(username, password)
      .expect(401)
      .expect((response) => {
        expect(response.body).toEqual({
          status: 401,
          message: 'User is inactive',
          violations: {},
        });
      });

    await login(username, 'wrong-password')
      .expect(401)
      .expect(expectInvalidCredentials);

    await login(`missing-${suffix}`, password)
      .expect(401)
      .expect(expectInvalidCredentials);

    await dataSource.getRepository(User).update(userId, { isActive: true });

    const reactivatedLogin = await login(username, password).expect(200);
    expect(typeof reactivatedLogin.body.token).toBe('string');
    expect(reactivatedLogin.body.user.id).toBe(userId);
  });

  it('returns 500 with unified payload when JWT_SECRET is missing during register', async () => {
    const previousJwtSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    try {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: `No Secret ${Date.now()}`,
          username: `no_secret_${Date.now()}`,
          password: 'password123',
        })
        .expect(500)
        .expect((response) => {
          expect(response.body).toEqual({
            status: 500,
            message: 'Internal server error',
            violations: {},
          });
        });
    } finally {
      process.env.JWT_SECRET = previousJwtSecret;
    }
  });

  it('handles concurrent updates deterministically with ownership and admin override', async () => {
    const userToken = signToken(UserRole.USER, USER_OWNER_ID);
    const otherUserToken = signToken(UserRole.USER, OTHER_USER_ID);
    const adminToken = signToken(UserRole.ADMIN, ADMIN_ID);

    const userBooksRepository = dataSource.getRepository(UserBook);
    const entity = await userBooksRepository.save({
      userId: USER_OWNER_ID,
      bookId: await createBookId(),
      rating: 10,
      comment: 'initial',
    });

    await Promise.all([
      request(app.getHttpServer())
        .put(`/user-books/${entity.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ comment: 'owner-update' })
        .expect(200),
      request(app.getHttpServer())
        .put(`/user-books/${entity.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ comment: 'forbidden-update' })
        .expect(403),
    ]);

    await Promise.all([
      request(app.getHttpServer())
        .put(`/user-books/${entity.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 70 })
        .expect(200),
      request(app.getHttpServer())
        .put(`/user-books/${entity.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rating: 80 })
        .expect(200),
    ]);

    const updated = await userBooksRepository.findOneOrFail({
      where: { id: entity.id },
    });

    expect([70, 80]).toContain(updated.rating as number);
  });
});

const resourceIdPipe = new ParseUUIDPipe({
  errorHttpStatusCode: HttpStatus.NOT_FOUND,
});

const NOT_FOUND_ID = '550e8400-e29b-41d4-a716-446655440000';

@Controller()
class ProtectionCatalogStubController {
  @Get('books')
  getBooks(): [] {
    return [];
  }

  @Get('books/:id')
  getBook(@Param('id', resourceIdPipe) id: string): { id: string } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Book not found');
    }

    return { id };
  }

  @Post('books')
  createBook(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('books/:id')
  updateBook(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Delete('books/:id')
  removeBook(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Get('movies')
  getMovies(): [] {
    return [];
  }

  @Get('movies/:id')
  getMovie(@Param('id', resourceIdPipe) id: string): { id: string } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Movie not found');
    }

    return { id };
  }

  @Post('movies')
  createMovie(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('movies/:id')
  updateMovie(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Delete('movies/:id')
  removeMovie(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Get('series')
  getSeries(): [] {
    return [];
  }

  @Get('series/:id')
  getSeriesById(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Series not found');
    }

    return { id };
  }

  @Post('series')
  createSeries(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('series/:id')
  updateSeries(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Delete('series/:id')
  removeSeries(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Get('games')
  getGames(): [] {
    return [];
  }

  @Get('games/:id')
  getGame(@Param('id', resourceIdPipe) id: string): { id: string } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Game not found');
    }

    return { id };
  }

  @Post('games')
  createGame(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('games/:id')
  updateGame(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Delete('games/:id')
  removeGame(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Get('authors')
  getAuthors(): [] {
    return [];
  }

  @Get('authors/:id')
  getAuthor(@Param('id', resourceIdPipe) id: string): { id: string } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Author not found');
    }

    return { id };
  }

  @Post('authors')
  createAuthor(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('authors/:id')
  updateAuthor(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Delete('authors/:id')
  removeAuthor(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Get('directors')
  getDirectors(): [] {
    return [];
  }

  @Get('directors/:id')
  getDirector(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Director not found');
    }

    return { id };
  }

  @Post('directors')
  createDirector(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('directors/:id')
  updateDirector(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Delete('directors/:id')
  removeDirector(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }
}

@Controller()
class UserListsStubController {
  @Get('user-books')
  getCurrentUserBooks(): [] {
    return [];
  }

  @Post('user-books')
  createCurrentUserBook(): { created: boolean } {
    return { created: true };
  }

  @Put('user-books/:id')
  updateCurrentUserBook(@Param('id', resourceIdPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-books/:id')
  removeCurrentUserBook(@Param('id', resourceIdPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-movies')
  getCurrentUserMovies(): [] {
    return [];
  }

  @Get('user-movies/stats')
  getCurrentUserMovieStats(): {
    total: number;
    thisMonth: number;
    avgRating: null;
  } {
    return { total: 0, thisMonth: 0, avgRating: null };
  }

  @Get('user-movies/:id')
  getCurrentUserMovieById(@Param('id', resourceIdPipe) id: string): {
    id: string;
  } {
    return { id };
  }

  @Post('user-movies')
  createCurrentUserMovie(): { created: boolean } {
    return { created: true };
  }

  @Put('user-movies/:id')
  updateCurrentUserMovie(@Param('id', resourceIdPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-movies/:id')
  removeCurrentUserMovie(@Param('id', resourceIdPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-series')
  getCurrentUserSeries(): [] {
    return [];
  }

  @Post('user-series')
  createCurrentUserSeries(): { created: boolean } {
    return { created: true };
  }

  @Put('user-series/:id')
  updateCurrentUserSeries(@Param('id', resourceIdPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-series/:id')
  removeCurrentUserSeries(@Param('id', resourceIdPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-games')
  getCurrentUserGames(): [] {
    return [];
  }

  @Post('user-games')
  createCurrentUserGame(): { created: boolean } {
    return { created: true };
  }

  @Put('user-games/:id')
  updateCurrentUserGame(@Param('id', resourceIdPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-games/:id')
  removeCurrentUserGame(@Param('id', resourceIdPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-authors')
  getCurrentUserAuthors(): [] {
    return [];
  }

  @Post('user-authors')
  createCurrentUserAuthor(): { created: boolean } {
    return { created: true };
  }

  @Put('user-authors/:id')
  updateCurrentUserAuthor(@Param('id', resourceIdPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-authors/:id')
  removeCurrentUserAuthor(@Param('id', resourceIdPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-directors')
  getCurrentUserDirectors(): [] {
    return [];
  }

  @Post('user-directors')
  createCurrentUserDirector(): { created: boolean } {
    return { created: true };
  }

  @Put('user-directors/:id')
  updateCurrentUserDirector(@Param('id', resourceIdPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-directors/:id')
  removeCurrentUserDirector(@Param('id', resourceIdPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user/:guid/books')
  getUserBooksByGuid(@Param('guid', resourceIdPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/movies')
  getUserMoviesByGuid(@Param('guid', resourceIdPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/series')
  getUserSeriesByGuid(@Param('guid', resourceIdPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/games')
  getUserGamesByGuid(@Param('guid', resourceIdPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/authors')
  getUserAuthorsByGuid(@Param('guid', resourceIdPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/directors')
  getUserDirectorsByGuid(
    @Param('guid', resourceIdPipe) guid: string,
  ): string[] {
    void guid;
    return [];
  }
}

@Module({
  imports: [
    TypeOrmModule.forRoot(e2eDbConfig),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [ProtectionCatalogStubController, UserListsStubController],
  providers: [JwtService, AuthMiddleware, AdminMiddleware],
})
class AuthProtectionTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'user-books', method: RequestMethod.ALL },
        { path: 'user-books/(.*)', method: RequestMethod.ALL },
        { path: 'user-movies', method: RequestMethod.GET },
        { path: 'user-movies/stats', method: RequestMethod.GET },
        { path: 'user-movies', method: RequestMethod.POST },
        { path: 'user-movies/:id', method: RequestMethod.PUT },
        { path: 'user-movies/:id', method: RequestMethod.DELETE },
        { path: 'user-series', method: RequestMethod.ALL },
        { path: 'user-series/(.*)', method: RequestMethod.ALL },
        { path: 'user-games', method: RequestMethod.ALL },
        { path: 'user-games/(.*)', method: RequestMethod.ALL },
        { path: 'user-authors', method: RequestMethod.ALL },
        { path: 'user-authors/(.*)', method: RequestMethod.ALL },
        { path: 'user-directors', method: RequestMethod.ALL },
        { path: 'user-directors/(.*)', method: RequestMethod.ALL },
      );

    consumer
      .apply(AuthMiddleware, AdminMiddleware)
      .forRoutes(
        { path: 'books', method: RequestMethod.POST },
        { path: 'books/:id', method: RequestMethod.PUT },
        { path: 'books/:id', method: RequestMethod.DELETE },
        { path: 'movies', method: RequestMethod.POST },
        { path: 'movies/:id', method: RequestMethod.PUT },
        { path: 'movies/:id', method: RequestMethod.DELETE },
        { path: 'series', method: RequestMethod.POST },
        { path: 'series/:id', method: RequestMethod.PUT },
        { path: 'series/:id', method: RequestMethod.DELETE },
        { path: 'games', method: RequestMethod.POST },
        { path: 'games/:id', method: RequestMethod.PUT },
        { path: 'games/:id', method: RequestMethod.DELETE },
        { path: 'authors', method: RequestMethod.POST },
        { path: 'authors/:id', method: RequestMethod.PUT },
        { path: 'authors/:id', method: RequestMethod.DELETE },
        { path: 'directors', method: RequestMethod.POST },
        { path: 'directors/:id', method: RequestMethod.PUT },
        { path: 'directors/:id', method: RequestMethod.DELETE },
      );
  }
}

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const PROTECTION_ADMIN_ID = '22222222-2222-4222-8222-222222222222';
const VALID_ITEM_ID = '33333333-3333-4333-8333-333333333333';
const PUBLIC_GUID = '44444444-4444-4444-8444-444444444444';

describe('Step 4 auth protection (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let originalJwtSecret: string | undefined;

  const protectedUserRoutes: Array<{
    method: HttpMethod;
    path: string;
    expectedStatus: number;
    body?: Record<string, unknown>;
  }> = [
    { method: 'get', path: '/user-books', expectedStatus: 200 },
    { method: 'post', path: '/user-books', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-books/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-books/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },

    { method: 'get', path: '/user-movies', expectedStatus: 200 },
    { method: 'get', path: '/user-movies/stats', expectedStatus: 200 },
    { method: 'post', path: '/user-movies', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-movies/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-movies/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },

    { method: 'get', path: '/user-series', expectedStatus: 200 },
    { method: 'post', path: '/user-series', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-series/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-series/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },

    { method: 'get', path: '/user-games', expectedStatus: 200 },
    { method: 'post', path: '/user-games', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-games/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-games/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },

    { method: 'get', path: '/user-authors', expectedStatus: 200 },
    { method: 'post', path: '/user-authors', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-authors/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-authors/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },

    { method: 'get', path: '/user-directors', expectedStatus: 200 },
    { method: 'post', path: '/user-directors', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-directors/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-directors/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },
  ];

  const publicGuidRoutes = [
    `/user/${PUBLIC_GUID}/books`,
    `/user/${PUBLIC_GUID}/movies`,
    `/user/${PUBLIC_GUID}/series`,
    `/user/${PUBLIC_GUID}/games`,
    `/user/${PUBLIC_GUID}/authors`,
    `/user/${PUBLIC_GUID}/directors`,
  ];

  const openGetRoutes = [
    '/books',
    '/books/550e8400-e29b-41d4-a716-446655440000',
    '/movies',
    '/movies/550e8400-e29b-41d4-a716-446655440000',
    '/series',
    '/series/550e8400-e29b-41d4-a716-446655440000',
    '/games',
    '/games/550e8400-e29b-41d4-a716-446655440000',
    '/authors',
    '/authors/550e8400-e29b-41d4-a716-446655440000',
    '/directors',
    '/directors/550e8400-e29b-41d4-a716-446655440000',
    '/user-movies/550e8400-e29b-41d4-a716-446655440000',
  ];

  const adminEntities: Array<{
    route: string;
    createBody: Record<string, unknown>;
    updateBody: Record<string, unknown>;
  }> = [
    {
      route: 'books',
      createBody: { title: 'Admin Book' },
      updateBody: { title: 'Admin Book Updated' },
    },
    {
      route: 'movies',
      createBody: { title: 'Admin Movie' },
      updateBody: { title: 'Admin Movie Updated' },
    },
    {
      route: 'series',
      createBody: { title: 'Admin Series' },
      updateBody: { title: 'Admin Series Updated' },
    },
    {
      route: 'games',
      createBody: { title: 'Admin Game' },
      updateBody: { title: 'Admin Game Updated' },
    },
    {
      route: 'authors',
      createBody: { fullName: 'Admin Author' },
      updateBody: { fullName: 'Admin Author Updated' },
    },
    {
      route: 'directors',
      createBody: { fullName: 'Admin Director' },
      updateBody: { fullName: 'Admin Director Updated' },
    },
  ];

  const signToken = (
    role: UserRole,
    userId: string,
    options?: SignOptions,
  ): string => {
    const payload: JwtPayload = {
      userId,
      username: `${role.toLowerCase()}-user`,
      name: `${role} User`,
      role,
    };

    return jwt.sign(payload, process.env.JWT_SECRET as string, {
      algorithm: 'HS256',
      expiresIn: '24h',
      ...options,
    });
  };

  const send = (
    method: HttpMethod,
    path: string,
    token?: string,
    body?: Record<string, unknown>,
  ) => {
    const req = request(app.getHttpServer())[method](path);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    if (body) {
      req.send(body);
    }

    return req;
  };

  beforeAll(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'step4-test-secret';

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthProtectionTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ApplicationValidationPipe());

    await app.init();
    dataSource = app.get(DataSource);

    await dataSource.getRepository(User).save([
      {
        id: USER_ID,
        name: 'Step4 User',
        username: 'step4-user',
        email: 'step4-user@test.dev',
        passwordHash: 'hash',
        role: UserRole.USER,
        isActive: true,
      },
      {
        id: PROTECTION_ADMIN_ID,
        name: 'Step4 Admin',
        username: 'step4-admin',
        email: 'step4-admin@test.dev',
        passwordHash: 'hash',
        role: UserRole.ADMIN,
        isActive: true,
      },
    ]);
  });

  afterAll(async () => {
    process.env.JWT_SECRET = originalJwtSecret;

    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    if (app) {
      await app.close();
    }
  });

  describe('JWT-protected user-* routes', () => {
    it.each(protectedUserRoutes)(
      '$method $path returns 401 without token',
      async ({ method, path, body }) => {
        await send(method, path, undefined, body).expect(401);
      },
    );

    it.each(protectedUserRoutes)(
      '$method $path returns 401 with invalid token',
      async ({ method, path, body }) => {
        await send(method, path, 'invalid-token', body).expect(401);
      },
    );

    it.each(protectedUserRoutes)(
      '$method $path returns 401 with expired token',
      async ({ method, path, body }) => {
        const expiredToken = signToken(UserRole.USER, USER_ID, {
          expiresIn: '-1h',
        });

        await send(method, path, expiredToken, body).expect(401);
      },
    );

    it.each(protectedUserRoutes)(
      '$method $path passes with valid JWT',
      async ({ method, path, body, expectedStatus }) => {
        const token = signToken(UserRole.USER, USER_ID);

        await send(method, path, token, body).expect(expectedStatus);
      },
    );

    it.each([
      '/user-books/not-a-uuid',
      '/user-movies/not-a-uuid',
      '/user-series/not-a-uuid',
      '/user-games/not-a-uuid',
      '/user-authors/not-a-uuid',
      '/user-directors/not-a-uuid',
    ])('PUT %s returns 404 for invalid id format', async (path) => {
      const token = signToken(UserRole.USER, USER_ID);
      await send('put', path, token, {}).expect(404);
    });
  });

  describe('Public user/:guid/* routes', () => {
    it.each(publicGuidRoutes)(
      '%s is accessible without token',
      async (path) => {
        await send('get', path).expect(200);
      },
    );

    it.each(publicGuidRoutes)(
      '%s is accessible with valid token',
      async (path) => {
        const token = signToken(UserRole.USER, USER_ID);
        await send('get', path, token).expect(200);
      },
    );

    it.each([
      '/user/not-a-guid/books',
      '/user/not-a-guid/movies',
      '/user/not-a-guid/series',
      '/user/not-a-guid/games',
      '/user/not-a-guid/authors',
      '/user/not-a-guid/directors',
    ])('%s returns 404 for invalid guid format', async (path) => {
      await send('get', path).expect(404);
    });
  });

  describe('Admin-only mutating /entity routes', () => {
    it.each(adminEntities)(
      'POST /$route returns 401 without token',
      async ({ route, createBody }) => {
        await send('post', `/${route}`, undefined, createBody).expect(401);
      },
    );

    it.each(adminEntities)(
      'POST /$route returns 403 for non-admin token',
      async ({ route, createBody }) => {
        const userToken = signToken(UserRole.USER, USER_ID);
        await send('post', `/${route}`, userToken, createBody).expect(403);
      },
    );

    it.each(adminEntities)(
      'POST /$route returns 401 for invalid or expired JWT',
      async ({ route, createBody }) => {
        await send('post', `/${route}`, 'invalid-token', createBody).expect(
          401,
        );

        const expiredToken = signToken(UserRole.ADMIN, PROTECTION_ADMIN_ID, {
          expiresIn: '-1h',
        });
        await send('post', `/${route}`, expiredToken, createBody).expect(401);
      },
    );

    it.each(adminEntities)(
      'POST/PUT/DELETE /$route passes for ADMIN token',
      async ({ route, createBody, updateBody }) => {
        const adminToken = signToken(UserRole.ADMIN, PROTECTION_ADMIN_ID);

        const created = await send(
          'post',
          `/${route}`,
          adminToken,
          createBody,
        ).expect(201);

        await send(
          'put',
          `/${route}/${created.body.id}`,
          adminToken,
          updateBody,
        ).expect(200);

        await send('delete', `/${route}/${created.body.id}`, adminToken).expect(
          200,
        );
      },
    );
  });

  describe('Open GET /entity routes', () => {
    it.each(openGetRoutes)('%s works without token', async (path) => {
      const response = await send('get', path).expect((res) => {
        expect([200, 404]).toContain(res.status);
      });

      expect([200, 404]).toContain(response.status);
    });

    it.each(openGetRoutes)(
      '%s is not blocked by invalid token',
      async (path) => {
        const response = await send('get', path, 'invalid-token').expect(
          (res) => {
            expect([200, 404]).toContain(res.status);
          },
        );

        expect([200, 404]).toContain(response.status);
      },
    );

    it.each(openGetRoutes)(
      '%s is not blocked by expired token',
      async (path) => {
        const expiredToken = signToken(UserRole.USER, USER_ID, {
          expiresIn: '-1h',
        });

        const response = await send('get', path, expiredToken).expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

        expect([200, 404]).toContain(response.status);
      },
    );
  });
});
