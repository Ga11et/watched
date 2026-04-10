/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * E2E тесты модуля series.
 * Публичных эндпоинтов нет: все GET защищены как минимум ролью GUEST.
 */
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
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../../src/users/entities/user.entity';
import { Series } from '../../src/series/entities/series.entity';
import { JwtService } from '../../src/auth/jwt.service';
import { AuthMiddleware } from '../../src/auth/auth.middleware';
import { AdminMiddleware } from '../../src/auth/admin.middleware';
import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import { SeriesModule } from '../../src/series/series.module';
import { Book } from '../../src/books/entities/book.entity';
import { Author } from '../../src/authors/entities/author.entity';
import { DataSource } from 'typeorm';

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
    SeriesModule,
  ],
  providers: [AuthMiddleware, AdminMiddleware],
})
class SeriesE2ETestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'series', method: RequestMethod.GET },
        { path: 'series/(.*)', method: RequestMethod.GET },
      );
    consumer
      .apply(AuthMiddleware, AdminMiddleware)
      .forRoutes(
        { path: 'series', method: RequestMethod.POST },
        { path: 'series/:id', method: RequestMethod.PUT },
        { path: 'series/:id', method: RequestMethod.DELETE },
      );
  }
}

describe('Series Module E2E Tests', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let seriesRepository: Repository<Series>;
  let jwtService: JwtService;

  let adminToken: string;
  let userToken: string;
  let guestToken: string;
  let testSeries: Series;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-series-e2e';
    jest.setTimeout(20000);

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SeriesE2ETestModule],
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
    seriesRepository = moduleFixture.get(getRepositoryToken(Series));
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

    testSeries = seriesRepository.create({
      id: '770e8400-e29b-41d4-a716-446655440001',
      title: 'Во все тяжкие',
      genres: 'Драма',
      rating: 9.5,
      totalSeasons: 5,
      watchedSeasons: 5,
      comment: 'Классика',
      poster: null,
    });
    await seriesRepository.save(testSeries);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Доступ по ролям: GET (только для авторизованных)', () => {
    it('GET /series без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/series').expect(401);
    });

    it('GET /series/stats без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/series/stats').expect(401);
    });

    it('GET /series/:id без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .get(`/series/${testSeries.id}`)
        .expect(401);
    });

    it('GET /series с токеном GUEST возвращает 200 и массив', () => {
      return request(app.getHttpServer())
        .get('/series')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /series/stats с токеном GUEST возвращает 200', () => {
      return request(app.getHttpServer())
        .get('/series/stats')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('thisMonth');
          expect(res.body).toHaveProperty('avgRating');
        });
    });

    it('GET /series/:id с токеном GUEST возвращает 200', () => {
      return request(app.getHttpServer())
        .get(`/series/${testSeries.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testSeries.id);
          expect(res.body.title).toBe(testSeries.title);
        });
    });

    it('GET /series с USER и ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .get('/series')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/series')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Доступ по ролям: POST /series', () => {
    it('POST без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .post('/series')
        .send({ title: 'Сериал' })
        .expect(401);
    });

    it('POST с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Сериал' })
        .expect(403);
      await request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ title: 'Сериал' })
        .expect(403);
    });

    it('POST с ADMIN возвращает 201', () => {
      return request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Игра престолов',
          genres: 'Фэнтези',
          totalSeasons: 8,
          rating: 9,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.title).toBe('Игра престолов');
        });
    });
  });

  describe('Доступ по ролям: PUT и DELETE', () => {
    it('PUT без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .put(`/series/${testSeries.id}`)
        .send({ title: 'Обновлено' })
        .expect(401);
    });

    it('PUT с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .put(`/series/${testSeries.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Обновлено' })
        .expect(403);
      await request(app.getHttpServer())
        .put(`/series/${testSeries.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ title: 'Обновлено' })
        .expect(403);
    });

    it('PUT с ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .put(`/series/${testSeries.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Во все тяжкие (обновлено)' })
        .expect(200);
      await seriesRepository.update(testSeries.id, { title: testSeries.title });
    });

    let seriesToDelete: Series;
    beforeAll(async () => {
      seriesToDelete = seriesRepository.create({ title: 'На удаление' });
      await seriesRepository.save(seriesToDelete);
    });

    it('DELETE без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .delete(`/series/${seriesToDelete.id}`)
        .expect(401);
    });

    it('DELETE с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .delete(`/series/${seriesToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      await request(app.getHttpServer())
        .delete(`/series/${seriesToDelete.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('DELETE с ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .delete(`/series/${seriesToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const found = await seriesRepository.findOne({
        where: { id: seriesToDelete.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('Крайние сценарии: создание', () => {
    it('POST с пустым title возвращает 422', () => {
      return request(app.getHttpServer())
        .post('/series')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '   ' })
        .expect(422)
        .expect((res) => expect(res.body.violations).toBeDefined());
    });
  });

  describe('Крайние сценарии: получение', () => {
    it('GET /series/:id с несуществующим UUID возвращает 404', () => {
      return request(app.getHttpServer())
        .get('/series/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(404);
    });

    it('GET /series/:id с невалидным UUID возвращает 404 или 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/series/not-a-uuid')
        .set('Authorization', `Bearer ${guestToken}`);
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('Крайние сценарии: обновление и удаление', () => {
    it('PUT с пустым title возвращает 422', () => {
      return request(app.getHttpServer())
        .put(`/series/${testSeries.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '   ' })
        .expect(422);
    });

    it('PUT с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .put('/series/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Название' })
        .expect(404);
    });

    it('DELETE с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .delete('/series/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Крайние сценарии: список и фильтры', () => {
    it('GET /series?sortBy=title&sortOrder=ASC возвращает 200', () => {
      return request(app.getHttpServer())
        .get('/series?sortBy=title&sortOrder=ASC')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });
  });

  describe('Невалидный токен', () => {
    it('GET /series с невалидным токеном возвращает 403', () => {
      return request(app.getHttpServer())
        .get('/series')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
    });

    it('POST /series с невалидным токеном возвращает 403', () => {
      return request(app.getHttpServer())
        .post('/series')
        .set('Authorization', 'Bearer invalid-token')
        .send({ title: 'Сериал' })
        .expect(403);
    });
  });
});
