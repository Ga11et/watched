/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AuthModule } from '../../src/auth/auth.module';
import { AuthMiddleware } from '../../src/auth/auth.middleware';
import { JwtService } from '../../src/auth/jwt.service';
import { DirectorsModule } from '../../src/directors/directors.module';
import { Movie } from '../../src/movies/entities/movie.entity';
import { MoviesModule } from '../../src/movies/movies.module';
import { UserListsModule } from '../../src/user-lists/user-lists.module';
import { UserMovie } from '../../src/user-lists/entities/user-movie.entity';
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

const IDS = {
  admin: '150e8400-e29b-41d4-a716-446655440001',
  user: '150e8400-e29b-41d4-a716-446655440002',
  otherUser: '150e8400-e29b-41d4-a716-446655440003',
  guest: '150e8400-e29b-41d4-a716-446655440004',
  movieA: '250e8400-e29b-41d4-a716-446655440001',
  movieB: '250e8400-e29b-41d4-a716-446655440002',
};

@Module({
  imports: [
    TypeOrmModule.forRoot(e2eDbConfig),
    AuthModule,
    UsersModule,
    DirectorsModule,
    MoviesModule,
    UserListsModule,
  ],
  providers: [AuthMiddleware],
})
class UserListMovieE2ETestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'user-movies', method: RequestMethod.ALL },
        { path: 'user-movies/(.*)', method: RequestMethod.ALL },
      );
  }
}

describe('UserList-Movie module (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let userMoviesRepository: Repository<UserMovie>;
  let moviesRepository: Repository<Movie>;
  let jwtService: JwtService;

  let adminToken: string;
  let userToken: string;
  let otherUserToken: string;
  let guestToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-userlist-movie-e2e';
    jest.setTimeout(20000);

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserListMovieE2ETestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();

    const dataSource = moduleFixture.get(DataSource);
    const [{ current_database: actualDb }] = await dataSource.query(
      'SELECT current_database() AS current_database',
    );

    if (actualDb !== TEST_DB_NAME) {
      await app.close();
      throw new Error(
        `Connected to database "${actualDb}" instead of test DB "${TEST_DB_NAME}". Aborting.`,
      );
    }

    usersRepository = moduleFixture.get(getRepositoryToken(User));
    userMoviesRepository = moduleFixture.get(getRepositoryToken(UserMovie));
    moviesRepository = moduleFixture.get(getRepositoryToken(Movie));
    jwtService = moduleFixture.get(JwtService);

    const [adminUser, regularUser, otherUser, guestUser] =
      await usersRepository.save([
        usersRepository.create({
          id: IDS.admin,
          username: 'admin-userlist-movie',
          email: 'admin-userlist-movie@example.com',
          name: 'Admin',
          passwordHash: '$2b$10$hash',
          role: UserRole.ADMIN,
          isActive: true,
        }),
        usersRepository.create({
          id: IDS.user,
          username: 'user-userlist-movie',
          email: 'user-userlist-movie@example.com',
          name: 'Regular User',
          passwordHash: '$2b$10$hash',
          role: UserRole.USER,
          isActive: true,
        }),
        usersRepository.create({
          id: IDS.otherUser,
          username: 'other-userlist-movie',
          email: 'other-userlist-movie@example.com',
          name: 'Other User',
          passwordHash: '$2b$10$hash',
          role: UserRole.USER,
          isActive: true,
        }),
        usersRepository.create({
          id: IDS.guest,
          username: 'guest-userlist-movie',
          email: 'guest-userlist-movie@example.com',
          name: 'Guest',
          passwordHash: '$2b$10$hash',
          role: UserRole.GUEST,
          isActive: true,
        }),
      ]);

    adminToken = jwtService.generateToken(adminUser);
    userToken = jwtService.generateToken(regularUser);
    otherUserToken = jwtService.generateToken(otherUser);
    guestToken = jwtService.generateToken(guestUser);

    await moviesRepository.save([
      moviesRepository.create({
        id: IDS.movieA,
        title: 'Movie A',
      }),
      moviesRepository.create({
        id: IDS.movieB,
        title: 'Movie B',
      }),
    ]);
  });

  beforeEach(async () => {
    await userMoviesRepository.clear();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('creates a user-movie entry with personal fields', async () => {
    await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        movieId: IDS.movieA,
        rating: 91,
        watchedAt: '2026-02-10T10:00:00.000Z',
        comment: 'Great one',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.userId).toBe(IDS.user);
        expect(res.body.movieId).toBe(IDS.movieA);
        expect(res.body.rating).toBe(91);
        expect(res.body.comment).toBe('Great one');
        expect(res.body.watchedAt).toEqual(expect.any(String));
      });
  });

  it('enforces one record per (user, movie)', async () => {
    await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ movieId: IDS.movieA, rating: 60 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ movieId: IDS.movieA, rating: 80 })
      .expect(409);
  });

  it('enforces role behavior for movie mutations', async () => {
    const foreignRecord = await userMoviesRepository.save(
      userMoviesRepository.create({
        userId: IDS.otherUser,
        movieId: IDS.movieB,
        rating: 40,
        watchedAt: null,
        comment: 'foreign',
      }),
    );

    await request(app.getHttpServer())
      .put(`/user-movies/${foreignRecord.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 50 })
      .expect(403);

    await request(app.getHttpServer())
      .put(`/user-movies/${foreignRecord.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ rating: 88, comment: 'admin edited' })
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(foreignRecord.id);
        expect(res.body.rating).toBe(88);
      });

    await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ movieId: IDS.movieA, rating: 10 })
      .expect(403);

    await request(app.getHttpServer())
      .put(`/user-movies/${foreignRecord.id}`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ rating: 10 })
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/user-movies/${foreignRecord.id}`)
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .delete(`/user-movies/${foreignRecord.id}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .expect(200);
  });
});
