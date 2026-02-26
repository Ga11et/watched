/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { UserListsModule } from '../src/user-lists/user-lists.module';
import { AuthMiddleware } from '../src/auth/auth.middleware';
import { JwtService } from '../src/auth/jwt.service';
import { User, UserRole } from '../src/users/entities/user.entity';
import { UserBook } from '../src/user-lists/entities/user-book.entity';
import { UserMovie } from '../src/user-lists/entities/user-movie.entity';
import { UserSeries } from '../src/user-lists/entities/user-series.entity';
import { UserGame } from '../src/user-lists/entities/user-game.entity';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_USER_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_ID = '33333333-3333-4333-8333-333333333333';
const GUEST_ID = '44444444-4444-4444-8444-444444444444';
const MISSING_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const BOOK_ID = '55555555-5555-4555-8555-555555555555';
const MOVIE_ID = '66666666-6666-4666-8666-666666666666';
const SERIES_ID = '77777777-7777-4777-8777-777777777777';
const GAME_ID = '88888888-8888-4888-8888-888888888888';

jest.setTimeout(30000);

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      dropSchema: true,
      synchronize: true,
      entities: [User, UserBook, UserMovie, UserSeries, UserGame],
    }),
    UserListsModule,
  ],
  providers: [JwtService, AuthMiddleware],
})
class Step5TestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'user-books', method: RequestMethod.ALL },
        { path: 'user-books/(.*)', method: RequestMethod.ALL },
        { path: 'user-movies', method: RequestMethod.ALL },
        { path: 'user-movies/(.*)', method: RequestMethod.ALL },
        { path: 'user-series', method: RequestMethod.ALL },
        { path: 'user-series/(.*)', method: RequestMethod.ALL },
        { path: 'user-games', method: RequestMethod.ALL },
        { path: 'user-games/(.*)', method: RequestMethod.ALL },
      );
  }
}

describe('Step 5 RBAC and ownership (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const signToken = (role: UserRole, userId: string): string => {
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
        expiresIn: '24h',
      },
    );
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'step5-test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [Step5TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    dataSource = app.get(DataSource);

    await dataSource.getRepository(User).save([
      {
        id: USER_ID,
        name: 'User',
        username: 'user',
        email: 'user@test.dev',
        passwordHash: 'hash',
        role: UserRole.USER,
        isActive: true,
      },
      {
        id: OTHER_USER_ID,
        name: 'Other User',
        username: 'other',
        email: 'other@test.dev',
        passwordHash: 'hash',
        role: UserRole.USER,
        isActive: true,
      },
      {
        id: ADMIN_ID,
        name: 'Admin',
        username: 'admin',
        email: 'admin@test.dev',
        passwordHash: 'hash',
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        id: GUEST_ID,
        name: 'Guest',
        username: 'guest',
        email: 'guest@test.dev',
        passwordHash: 'hash',
        role: UserRole.GUEST,
        isActive: true,
      },
    ]);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    if (app) {
      await app.close();
    }
  });

  it('rejects userId spoofing in payload for create (whitelist edge-case)', async () => {
    const token = signToken(UserRole.USER, USER_ID);

    await request(app.getHttpServer())
      .post('/user-books')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: OTHER_USER_ID,
        bookId: BOOK_ID,
      })
      .expect(400);
  });

  it.each([
    {
      route: '/user-books',
      createBody: { bookId: BOOK_ID },
      updateBody: { rating: 88, comment: 'updated book' },
      repository: UserBook,
      fkField: 'bookId',
      fkValue: BOOK_ID,
    },
    {
      route: '/user-movies',
      createBody: { movieId: MOVIE_ID },
      updateBody: { rating: 77, comment: 'updated movie' },
      repository: UserMovie,
      fkField: 'movieId',
      fkValue: MOVIE_ID,
    },
    {
      route: '/user-series',
      createBody: { seriesId: SERIES_ID },
      updateBody: { rating: 66, seasonsWatched: 3, comment: 'updated series' },
      repository: UserSeries,
      fkField: 'seriesId',
      fkValue: SERIES_ID,
    },
    {
      route: '/user-games',
      createBody: { gameId: GAME_ID },
      updateBody: { rating: 99, playedHours: 20, comment: 'updated game' },
      repository: UserGame,
      fkField: 'gameId',
      fkValue: GAME_ID,
    },
  ])(
    '$route enforces USER ownership and allows ADMIN override',
    async ({ route, createBody, updateBody, repository, fkField, fkValue }) => {
      const userToken = signToken(UserRole.USER, USER_ID);
      const adminToken = signToken(UserRole.ADMIN, ADMIN_ID);

      const createdByUser = await request(app.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${userToken}`)
        .send(createBody)
        .expect(201);

      expect(createdByUser.body.userId).toBe(USER_ID);

      const repo = dataSource.getRepository(repository);
      const foreignEntry = await repo.save({
        userId: OTHER_USER_ID,
        [fkField]: fkValue,
      });

      await request(app.getHttpServer())
        .put(`${route}/${foreignEntry.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateBody)
        .expect(403);

      await request(app.getHttpServer())
        .put(`${route}/${foreignEntry.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateBody)
        .expect(200);
    },
  );

  it.each(['/user-books', '/user-movies', '/user-series', '/user-games'])(
    'GUEST cannot create in %s',
    async (route) => {
      const guestToken = signToken(UserRole.GUEST, GUEST_ID);
      const body =
        route === '/user-books'
          ? { bookId: BOOK_ID }
          : route === '/user-movies'
            ? { movieId: MOVIE_ID }
            : route === '/user-series'
              ? { seriesId: SERIES_ID }
              : { gameId: GAME_ID };

      await request(app.getHttpServer())
        .post(route)
        .set('Authorization', `Bearer ${guestToken}`)
        .send(body)
        .expect(403);
    },
  );

  it('returns 404 for update of non-existing user-list record', async () => {
    const token = signToken(UserRole.ADMIN, ADMIN_ID);

    await request(app.getHttpServer())
      .put(`/user-books/${MISSING_ID}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 50 })
      .expect(404);
  });

  it('validates rating bounds and rejects >100 edge-case', async () => {
    const token = signToken(UserRole.USER, USER_ID);

    await request(app.getHttpServer())
      .post('/user-games')
      .set('Authorization', `Bearer ${token}`)
      .send({
        gameId: GAME_ID,
        rating: 101,
      })
      .expect(400);
  });

  it('keeps /user/:guid/books public and scoped by guid', async () => {
    await dataSource.getRepository(UserBook).save({
      userId: USER_ID,
      bookId: BOOK_ID,
      comment: 'visible for user guid',
    });
    await dataSource.getRepository(UserBook).save({
      userId: OTHER_USER_ID,
      bookId: BOOK_ID,
      comment: 'must not leak to user guid',
    });

    const response = await request(app.getHttpServer())
      .get(`/user/${USER_ID}/books`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    const items = response.body as Array<{ userId: string }>;
    expect(items.every((entry) => entry.userId === USER_ID)).toBe(true);
  });
});
