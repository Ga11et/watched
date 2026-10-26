/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
  Post,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';
import { DataSource, QueryFailedError } from 'typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { UserListsModule } from '../src/user-lists/user-lists.module';
import { UsersModule } from '../src/users/users.module';
import { AuthMiddleware } from '../src/auth/auth.middleware';
import { AdminMiddleware } from '../src/auth/admin.middleware';
import { JwtService } from '../src/auth/jwt.service';
import { ApiExceptionFilter } from '../src/auth/api-exception.filter';
import { User, UserRole } from '../src/users/entities/user.entity';
import { UserBook } from '../src/user-lists/entities/user-book.entity';
import { Book } from '../src/books/entities/book.entity';
import { BooksModule } from '../src/books/books.module';
import { AuthorsModule } from '../src/authors/authors.module';
import { DirectorsModule } from '../src/directors/directors.module';
import { APP_FILTER } from '@nestjs/core';

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
