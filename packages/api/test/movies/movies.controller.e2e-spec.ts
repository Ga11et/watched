/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
import { AdminMiddleware } from '../../src/auth/admin.middleware';
import { ApiExceptionFilter } from '../../src/auth/api-exception.filter';
import { AuthMiddleware } from '../../src/auth/auth.middleware';
import { AuthModule } from '../../src/auth/auth.module';
import { JwtService } from '../../src/auth/jwt.service';
import { AuthorsModule } from '../../src/authors/authors.module';
import { BooksModule } from '../../src/books/books.module';
import { ApplicationValidationPipe } from '../../src/common/application-validation.pipe';
import { DevelopersModule } from '../../src/developers/developers.module';
import { DirectorsModule } from '../../src/directors/directors.module';
import { GamesModule } from '../../src/games/games.module';
import { MoviesModule } from '../../src/movies/movies.module';
import { PublishersModule } from '../../src/publishers/publishers.module';
import { SeriesModule } from '../../src/series/series.module';
import { UserListsModule } from '../../src/user-lists/user-lists.module';
import { User, UserRole } from '../../src/users/entities/user.entity';
import { UsersModule } from '../../src/users/users.module';
import { Movie } from '../../src/movies/entities/movie.entity';
import { Director } from '../../src/directors/entities/director.entity';
import { Book } from '../../src/books/entities/book.entity';
import { Author } from '../../src/authors/entities/author.entity';

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

const MISSING_ID = '00000000-0000-4000-8000-000000000404';

@Module({
  imports: [
    TypeOrmModule.forRoot(e2eDbConfig),
    AuthModule,
    UsersModule,
    AuthorsModule,
    BooksModule,
    DevelopersModule,
    DirectorsModule,
    GamesModule,
    MoviesModule,
    PublishersModule,
    SeriesModule,
    UserListsModule,
  ],
  providers: [AuthMiddleware, AdminMiddleware],
})
class MoviesControllerTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'movies', method: RequestMethod.GET },
        { path: 'movies/(.*)', method: RequestMethod.GET },
      );
    consumer
      .apply(AuthMiddleware, AdminMiddleware)
      .forRoutes(
        { path: 'movies', method: RequestMethod.POST },
        { path: 'movies/:id', method: RequestMethod.PUT },
      );
  }
}

describe('MoviesController (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let userToken: string;
  let originalJwtSecret: string | undefined;

  beforeAll(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'movies-controller-e2e-secret';

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture = await Test.createTestingModule({
      imports: [MoviesControllerTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ApplicationValidationPipe());
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();

    const usersRepository = app.get(DataSource).getRepository(User);
    const jwtService = app.get(JwtService);
    const [admin, user] = await usersRepository.save([
      usersRepository.create({
        name: 'Admin',
        username: 'movies_admin',
        email: 'movies_admin@test.dev',
        passwordHash: 'hash',
        role: UserRole.ADMIN,
        isActive: true,
      }),
      usersRepository.create({
        name: 'User',
        username: 'movies_user',
        email: 'movies_user@test.dev',
        passwordHash: 'hash',
        role: UserRole.USER,
        isActive: true,
      }),
    ]);
    adminToken = jwtService.generateToken(admin);
    userToken = jwtService.generateToken(user);
  });

  afterAll(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    await app?.close();
  });

  const post = (body: Record<string, unknown>, token?: string) => {
    const pending = request(app.getHttpServer()).post('/movies');

    return (
      token ? pending.set('Authorization', `Bearer ${token}`) : pending
    ).send(body);
  };

  describe('POST /movies', () => {
    it('returns a field violation for a blank title', async () => {
      const response = await post({ title: '   ' }, adminToken).expect(422);

      expect(response.body).toEqual({
        status: 422,
        message: 'Произошла ошибка при создании фильма',
        violations: { title: 'Название обязательно' },
      });
    });

    it('returns a field violation for missing directorIds', async () => {
      const response = await post(
        { title: 'Relation check', directorIds: [MISSING_ID] },
        adminToken,
      ).expect(422);

      expect(response.body).toEqual({
        status: 422,
        message: 'Произошла ошибка при обработке режиссёров фильма',
        violations: { directorIds: 'Один или несколько режиссёров не найдены' },
      });
    });

    it('returns empty violations without a token', async () => {
      const response = await post({ title: 'Valid' }).expect(401);

      expect(response.body).toEqual({
        status: 401,
        message: 'Authorization token required',
        violations: {},
      });
    });

    it('returns empty violations for a non-admin', async () => {
      const response = await post({ title: 'Valid' }, userToken).expect(403);

      expect(response.body).toEqual({
        status: 403,
        message: 'Admin access required',
        violations: {},
      });
    });
  });

  describe('PUT /movies/:id', () => {
    it('returns a field violation for a blank title', async () => {
      const created = await post({ title: 'Before update' }, adminToken).expect(
        201,
      );

      const response = await request(app.getHttpServer())
        .put(`/movies/${(created.body as { id: string }).id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '   ' })
        .expect(422);

      expect(response.body).toEqual({
        status: 422,
        message: 'Произошла ошибка при обновлении фильма',
        violations: { title: 'Название не может быть пустым' },
      });
    });
  });

  describe('GET /movies/:id', () => {
    it('returns empty violations when the record is missing', async () => {
      const response = await request(app.getHttpServer())
        .get(`/movies/${MISSING_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: `Фильм с ID ${MISSING_ID} не найден`,
        violations: {},
      });
    });
  });
});

/**
 * E2E тесты модуля movies.
 * Публичных эндпоинтов нет: все GET защищены как минимум ролью GUEST.
 */

@Module({
  imports: [
    TypeOrmModule.forRoot(e2eDbConfig),
    TypeOrmModule.forFeature([Book, Author]),
    AuthModule,
    UsersModule,
    MoviesModule,
    DirectorsModule,
  ],
  providers: [AuthMiddleware, AdminMiddleware],
})
class MoviesE2ETestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'movies', method: RequestMethod.GET },
        { path: 'movies/(.*)', method: RequestMethod.GET },
      );
    consumer
      .apply(AuthMiddleware, AdminMiddleware)
      .forRoutes(
        { path: 'movies', method: RequestMethod.POST },
        { path: 'movies/:id', method: RequestMethod.PUT },
        { path: 'movies/:id', method: RequestMethod.DELETE },
      );
  }
}

describe('Movies Module E2E Tests', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let moviesRepository: Repository<Movie>;
  let directorsRepository: Repository<Director>;
  let jwtService: JwtService;

  let adminToken: string;
  let userToken: string;
  let guestToken: string;
  let testDirector: Director;
  let secondDirector: Director;
  let testMovie: Movie;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-movies-e2e';
    jest.setTimeout(20000);

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MoviesE2ETestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        errorHttpStatusCode: 422,
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
    moviesRepository = moduleFixture.get(getRepositoryToken(Movie));
    directorsRepository = moduleFixture.get(getRepositoryToken(Director));
    jwtService = moduleFixture.get(JwtService);

    const [adminUser, plainUser, guestUser] = [
      usersRepository.create({
        id: '550e8400-e29b-41d4-a716-446655440001',
        username: 'admin',
        email: 'admin@example.com',
        name: 'Admin',
        passwordHash: '$2b$10$hash',
        role: UserRole.ADMIN,
        isActive: true,
      }),
      usersRepository.create({
        id: '550e8400-e29b-41d4-a716-446655440002',
        username: 'user',
        email: 'user@example.com',
        name: 'User',
        passwordHash: '$2b$10$hash',
        role: UserRole.USER,
        isActive: true,
      }),
      usersRepository.create({
        id: '550e8400-e29b-41d4-a716-446655440003',
        username: 'guest',
        email: 'guest@example.com',
        name: 'Guest',
        passwordHash: '$2b$10$hash',
        role: UserRole.GUEST,
        isActive: true,
      }),
    ];
    await usersRepository.save([adminUser, plainUser, guestUser]);

    adminToken = jwtService.generateToken(adminUser);
    userToken = jwtService.generateToken(plainUser);
    guestToken = jwtService.generateToken(guestUser);

    testDirector = directorsRepository.create({
      id: '660e8400-e29b-41d4-a716-446655440001',
      fullName: 'Кристофер Нолан',
      comment: null,
      photo: null,
    });
    secondDirector = directorsRepository.create({
      id: '660e8400-e29b-41d4-a716-446655440002',
      fullName: 'Лана Вачовски',
      comment: null,
      photo: null,
    });
    await directorsRepository.save([testDirector, secondDirector]);

    testMovie = moviesRepository.create({
      id: '770e8400-e29b-41d4-a716-446655440001',
      title: 'Интерстеллар',
      genre: 'Фантастика',
      releaseYear: 2014,
      poster: null,
      directors: [testDirector],
    });
    await moviesRepository.save(testMovie);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Доступ по ролям: GET (только для авторизованных)', () => {
    it('GET /movies без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/movies').expect(401);
    });

    it('GET /movies/stats без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/movies/stats').expect(401);
    });

    it('GET /movies/:id без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .get(`/movies/${testMovie.id}`)
        .expect(401);
    });

    it('GET /movies с токеном GUEST возвращает 200 и массив', () => {
      return request(app.getHttpServer())
        .get('/movies')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /movies/stats с токеном GUEST возвращает 200 и структуру', () => {
      return request(app.getHttpServer())
        .get('/movies/stats')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('thisMonth');
          expect(res.body).toHaveProperty('avgRating');
        });
    });

    it('GET /movies/:id с токеном GUEST возвращает 200', () => {
      return request(app.getHttpServer())
        .get(`/movies/${testMovie.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testMovie.id);
          expect(res.body.title).toBe(testMovie.title);
          expect(res.body).not.toHaveProperty('rating');
          expect(res.body).not.toHaveProperty('watchedAt');
          expect(res.body).not.toHaveProperty('comment');
          expect(res.body.directors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ id: testDirector.id }),
            ]),
          );
        });
    });

    it('GET /movies с USER и ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .get('/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Доступ по ролям: POST /movies', () => {
    it('POST без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .post('/movies')
        .send({ title: 'Фильм' })
        .expect(401);
    });

    it('POST с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Фильм' })
        .expect(403);
      await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ title: 'Фильм' })
        .expect(403);
    });

    it('POST с ADMIN возвращает 201', () => {
      return request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Начало',
          genre: 'Фантастика',
          directorIds: [testDirector.id, secondDirector.id],
          rating: 90,
          watchedAt: '2026-02-10T10:00:00.000Z',
          comment: 'Это персональный комментарий',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.title).toBe('Начало');
          expect(res.body).not.toHaveProperty('rating');
          expect(res.body).not.toHaveProperty('watchedAt');
          expect(res.body).not.toHaveProperty('comment');
          expect(res.body.directors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ id: testDirector.id }),
              expect.objectContaining({ id: secondDirector.id }),
            ]),
          );
        });
    });

    it('POST multipart сохраняет всех выбранных режиссёров', async () => {
      const created = await request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Совместный фильм')
        .field('directorIds[]', testDirector.id)
        .field('directorIds[]', secondDirector.id)
        .expect(201);

      expect(created.body.directors).toHaveLength(2);
      expect(created.body.directors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: testDirector.id }),
          expect.objectContaining({ id: secondDirector.id }),
        ]),
      );

      await request(app.getHttpServer())
        .get(`/movies/${created.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.directors).toHaveLength(2);
          expect(res.body.directors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ id: testDirector.id }),
              expect.objectContaining({ id: secondDirector.id }),
            ]),
          );
        });
    });

    it('POST с legacy directorId не создает связь с режиссёром', () => {
      return request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Legacy director field',
          directorId: testDirector.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.directors).toEqual([]);
        });
    });
  });

  describe('Доступ по ролям: PUT и DELETE', () => {
    it('PUT без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .put(`/movies/${testMovie.id}`)
        .send({ title: 'Обновлено' })
        .expect(401);
    });

    it('PUT с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .put(`/movies/${testMovie.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Обновлено' })
        .expect(403);
      await request(app.getHttpServer())
        .put(`/movies/${testMovie.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ title: 'Обновлено' })
        .expect(403);
    });

    it('PUT с ADMIN возвращает 200 и обновляет связи many-to-many режиссёров', async () => {
      await request(app.getHttpServer())
        .put(`/movies/${testMovie.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Интерстеллар (обновлено)',
          comment: 'Новый комментарий',
          directorIds: [secondDirector.id],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.directors).toEqual([
            expect.objectContaining({ id: secondDirector.id }),
          ]);
        });
      await moviesRepository.update(testMovie.id, {
        title: testMovie.title,
      });
      await moviesRepository
        .createQueryBuilder()
        .relation(Movie, 'directors')
        .of(testMovie.id)
        .remove([secondDirector.id]);
    });

    let movieToDelete: Movie;
    beforeAll(async () => {
      movieToDelete = moviesRepository.create({ title: 'На удаление' });
      await moviesRepository.save(movieToDelete);
    });

    it('DELETE без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .delete(`/movies/${movieToDelete.id}`)
        .expect(401);
    });

    it('DELETE с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .delete(`/movies/${movieToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      await request(app.getHttpServer())
        .delete(`/movies/${movieToDelete.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('DELETE с ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .delete(`/movies/${movieToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const found = await moviesRepository.findOne({
        where: { id: movieToDelete.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('Крайние сценарии: создание', () => {
    it('POST с пустым title возвращает 422', () => {
      return request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '   ' })
        .expect(422)
        .expect((res) => {
          expect(res.body.violations).toEqual({
            title: 'Название обязательно',
          });
        });
    });
  });

  describe('Крайние сценарии: получение', () => {
    it('GET /movies/:id с несуществующим UUID возвращает 404', () => {
      return request(app.getHttpServer())
        .get('/movies/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(404);
    });

    it('GET /movies/:id с невалидным UUID возвращает 404 или 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/movies/not-a-uuid')
        .set('Authorization', `Bearer ${guestToken}`);
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('Крайние сценарии: обновление и удаление', () => {
    it('PUT с пустым title возвращает 422', () => {
      return request(app.getHttpServer())
        .put(`/movies/${testMovie.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '   ' })
        .expect(422);
    });

    it('PUT с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .put('/movies/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Название' })
        .expect(404);
    });

    it('DELETE с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .delete('/movies/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Крайние сценарии: список и фильтры', () => {
    it('GET /movies?sortBy=title&sortOrder=ASC возвращает 200', () => {
      return request(app.getHttpServer())
        .get('/movies?sortBy=title&sortOrder=ASC')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /movies?directorId= возвращает только фильмы режиссёра', () => {
      return request(app.getHttpServer())
        .get(`/movies?directorId=${testDirector.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((m: { directors: Array<{ id: string }> }) => {
            expect(
              m.directors.some((director: { id: string }) => {
                return director.id === testDirector.id;
              }),
            ).toBe(true);
          });
        });
    });

    it('GET /movies?limit=1 возвращает не более 1', () => {
      return request(app.getHttpServer())
        .get('/movies?limit=1')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(1);
        });
    });
  });

  describe('Невалидный токен', () => {
    it('GET /movies с невалидным токеном возвращает 401', () => {
      return request(app.getHttpServer())
        .get('/movies')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('POST /movies с невалидным токеном возвращает 401', () => {
      return request(app.getHttpServer())
        .post('/movies')
        .set('Authorization', 'Bearer invalid-token')
        .send({ title: 'Фильм' })
        .expect(401);
    });
  });
});
