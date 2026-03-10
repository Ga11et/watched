/**
 * E2E тесты модуля directors.
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
import { User, UserRole } from '../src/users/entities/user.entity';
import { Director } from '../src/directors/entities/director.entity';
import { JwtService } from '../src/auth/jwt.service';
import { AuthMiddleware } from '../src/auth/auth.middleware';
import { AdminMiddleware } from '../src/auth/admin.middleware';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { DirectorsModule } from '../src/directors/directors.module';
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
    AuthModule,
    UsersModule,
    DirectorsModule,
  ],
  providers: [AuthMiddleware, AdminMiddleware],
})
class DirectorsE2ETestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'directors', method: RequestMethod.GET },
        { path: 'directors/(.*)', method: RequestMethod.GET },
      );
    consumer
      .apply(AuthMiddleware, AdminMiddleware)
      .forRoutes(
        { path: 'directors', method: RequestMethod.POST },
        { path: 'directors/:id', method: RequestMethod.PUT },
        { path: 'directors/:id', method: RequestMethod.DELETE },
      );
  }
}

describe('Directors Module E2E Tests', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let directorsRepository: Repository<Director>;
  let jwtService: JwtService;

  let adminToken: string;
  let userToken: string;
  let guestToken: string;
  let testDirector: Director;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-directors-e2e';
    jest.setTimeout(20000);

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [DirectorsE2ETestModule],
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
      fullName: 'Квентин Тарантино',
      comment: null,
      photo: null,
    });
    await directorsRepository.save(testDirector);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Доступ по ролям: GET (только для авторизованных)', () => {
    it('GET /directors без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/directors').expect(401);
    });

    it('GET /directors/stats без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/directors/stats').expect(401);
    });

    it('GET /directors/:id без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .get(`/directors/${testDirector.id}`)
        .expect(401);
    });

    it('GET /directors с токеном GUEST возвращает 200 и массив', () => {
      return request(app.getHttpServer())
        .get('/directors')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /directors/stats с токеном GUEST возвращает 200 и total', () => {
      return request(app.getHttpServer())
        .get('/directors/stats')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(typeof res.body.total).toBe('number');
        });
    });

    it('GET /directors/:id с токеном GUEST возвращает 200', () => {
      return request(app.getHttpServer())
        .get(`/directors/${testDirector.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testDirector.id);
          expect(res.body.fullName).toBe(testDirector.fullName);
        });
    });

    it('GET /directors с USER и ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .get('/directors')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/directors')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Доступ по ролям: POST /directors', () => {
    it('POST без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .post('/directors')
        .send({ fullName: 'Новый режиссёр' })
        .expect(401);
    });

    it('POST с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .post('/directors')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ fullName: 'Режиссёр' })
        .expect(403);
      await request(app.getHttpServer())
        .post('/directors')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ fullName: 'Режиссёр' })
        .expect(403);
    });

    it('POST с ADMIN возвращает 201', () => {
      return request(app.getHttpServer())
        .post('/directors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: 'Кристофер Нолан', comment: 'Режиссёр' })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.fullName).toBe('Кристофер Нолан');
        });
    });
  });

  describe('Доступ по ролям: PUT и DELETE', () => {
    it('PUT без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .put(`/directors/${testDirector.id}`)
        .send({ fullName: 'Обновлено' })
        .expect(401);
    });

    it('PUT с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .put(`/directors/${testDirector.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ fullName: 'Обновлено' })
        .expect(403);
      await request(app.getHttpServer())
        .put(`/directors/${testDirector.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ fullName: 'Обновлено' })
        .expect(403);
    });

    it('PUT с ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .put(`/directors/${testDirector.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: 'Квентин Тарантино (обновлено)' })
        .expect(200);
      await directorsRepository.update(testDirector.id, {
        fullName: testDirector.fullName,
      });
    });

    let directorToDelete: Director;
    beforeAll(async () => {
      directorToDelete = directorsRepository.create({ fullName: 'На удаление' });
      await directorsRepository.save(directorToDelete);
    });

    it('DELETE без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .delete(`/directors/${directorToDelete.id}`)
        .expect(401);
    });

    it('DELETE с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .delete(`/directors/${directorToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      await request(app.getHttpServer())
        .delete(`/directors/${directorToDelete.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('DELETE с ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .delete(`/directors/${directorToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const found = await directorsRepository.findOne({
        where: { id: directorToDelete.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('Крайние сценарии: создание', () => {
    it('POST с пустым fullName возвращает 422', () => {
      return request(app.getHttpServer())
        .post('/directors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: '   ' })
        .expect(422)
        .expect((res) => expect(res.body.violations).toBeDefined());
    });
  });

  describe('Крайние сценарии: получение и обновление', () => {
    it('GET /directors/:id с несуществующим UUID возвращает 404', () => {
      return request(app.getHttpServer())
        .get('/directors/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(404);
    });

    it('GET /directors/:id с невалидным UUID возвращает 404 или 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/directors/not-a-uuid')
        .set('Authorization', `Bearer ${guestToken}`);
      expect([400, 404]).toContain(res.status);
    });

    it('PUT с пустым fullName возвращает 422', () => {
      return request(app.getHttpServer())
        .put(`/directors/${testDirector.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: '   ' })
        .expect(422);
    });

    it('PUT с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .put('/directors/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: 'Имя' })
        .expect(404);
    });

    it('DELETE с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .delete('/directors/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Крайние сценарии: список и фильтры', () => {
    it('GET /directors?sortBy=fullName&sortOrder=ASC возвращает 200', () => {
      return request(app.getHttpServer())
        .get('/directors?sortBy=fullName&sortOrder=ASC')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /directors?limit=1 возвращает не более 1', () => {
      return request(app.getHttpServer())
        .get('/directors?limit=1')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(1);
        });
    });
  });

  describe('Невалидный токен', () => {
    it('GET /directors с невалидным токеном возвращает 403', () => {
      return request(app.getHttpServer())
        .get('/directors')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
    });

    it('POST /directors с невалидным токеном возвращает 403', () => {
      return request(app.getHttpServer())
        .post('/directors')
        .set('Authorization', 'Bearer invalid-token')
        .send({ fullName: 'Имя' })
        .expect(403);
    });
  });
});
