/**
 * E2E тесты модуля publishers.
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
import { Publisher } from '../../src/publishers/entities/publisher.entity';
import { JwtService } from '../../src/auth/jwt.service';
import { AuthMiddleware } from '../../src/auth/auth.middleware';
import { AdminMiddleware } from '../../src/auth/admin.middleware';
import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import { PublishersModule } from '../../src/publishers/publishers.module';
import { DataSource } from 'typeorm';
import { Game } from '../../src/games/entities/game.entity';
import { Developer } from '../../src/developers/entities/developer.entity';

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
    TypeOrmModule.forFeature([Game, Developer]),
    AuthModule,
    UsersModule,
    PublishersModule,
  ],
  providers: [AuthMiddleware, AdminMiddleware],
})
class PublishersE2ETestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'publishers', method: RequestMethod.GET },
        { path: 'publishers/(.*)', method: RequestMethod.GET },
      );
    consumer
      .apply(AuthMiddleware, AdminMiddleware)
      .forRoutes(
        { path: 'publishers', method: RequestMethod.POST },
        { path: 'publishers/:id', method: RequestMethod.PUT },
        { path: 'publishers/:id', method: RequestMethod.DELETE },
      );
  }
}

describe('Publishers Module E2E Tests', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let publishersRepository: Repository<Publisher>;
  let jwtService: JwtService;

  let adminToken: string;
  let userToken: string;
  let guestToken: string;
  let testPublisher: Publisher;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-publishers-e2e';
    jest.setTimeout(20000);

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PublishersE2ETestModule],
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
    publishersRepository = moduleFixture.get(getRepositoryToken(Publisher));
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

    testPublisher = publishersRepository.create({
      id: '660e8400-e29b-41d4-a716-446655440001',
      fullName: 'CD Projekt',
      comment: null,
      photo: null,
    });
    await publishersRepository.save(testPublisher);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Доступ по ролям: GET (только для авторизованных)', () => {
    it('GET /publishers без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/publishers').expect(401);
    });

    it('GET /publishers/stats без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/publishers/stats').expect(401);
    });

    it('GET /publishers/search без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .get('/publishers/search?q=CD')
        .expect(401);
    });

    it('GET /publishers/:id без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .get(`/publishers/${testPublisher.id}`)
        .expect(401);
    });

    it('GET /publishers с токеном GUEST возвращает 200 и массив', () => {
      return request(app.getHttpServer())
        .get('/publishers')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /publishers/stats с токеном GUEST возвращает 200 и total', () => {
      return request(app.getHttpServer())
        .get('/publishers/stats')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(typeof res.body.total).toBe('number');
        });
    });

    it('GET /publishers/search?q= с токеном GUEST возвращает 200', () => {
      return request(app.getHttpServer())
        .get('/publishers/search?q=CD')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /publishers/:id с токеном GUEST возвращает 200', () => {
      return request(app.getHttpServer())
        .get(`/publishers/${testPublisher.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testPublisher.id);
          expect(res.body.fullName).toBe(testPublisher.fullName);
        });
    });

    it('GET /publishers с USER и ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .get('/publishers')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/publishers')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Доступ по ролям: POST /publishers', () => {
    it('POST без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .post('/publishers')
        .send({ fullName: 'Издатель' })
        .expect(401);
    });

    it('POST с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .post('/publishers')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ fullName: 'Издатель' })
        .expect(403);
      await request(app.getHttpServer())
        .post('/publishers')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ fullName: 'Издатель' })
        .expect(403);
    });

    it('POST с ADMIN возвращает 201', () => {
      return request(app.getHttpServer())
        .post('/publishers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: 'Larian Studios', comment: 'Издатель' })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.fullName).toBe('Larian Studios');
        });
    });
  });

  describe('Доступ по ролям: PUT и DELETE', () => {
    it('PUT без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .put(`/publishers/${testPublisher.id}`)
        .send({ fullName: 'Обновлено' })
        .expect(401);
    });

    it('PUT с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .put(`/publishers/${testPublisher.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ fullName: 'Обновлено' })
        .expect(403);
      await request(app.getHttpServer())
        .put(`/publishers/${testPublisher.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ fullName: 'Обновлено' })
        .expect(403);
    });

    it('PUT с ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .put(`/publishers/${testPublisher.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: 'CD Projekt (обновлено)' })
        .expect(200);
      await publishersRepository.update(testPublisher.id, {
        fullName: testPublisher.fullName,
      });
    });

    let publisherToDelete: Publisher;
    beforeAll(async () => {
      publisherToDelete = publishersRepository.create({
        fullName: 'На удаление',
      });
      await publishersRepository.save(publisherToDelete);
    });

    it('DELETE без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .delete(`/publishers/${publisherToDelete.id}`)
        .expect(401);
    });

    it('DELETE с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .delete(`/publishers/${publisherToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      await request(app.getHttpServer())
        .delete(`/publishers/${publisherToDelete.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('DELETE с ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .delete(`/publishers/${publisherToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const found = await publishersRepository.findOne({
        where: { id: publisherToDelete.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('Крайние сценарии: создание', () => {
    it('POST с пустым fullName возвращает 422', () => {
      return request(app.getHttpServer())
        .post('/publishers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: '   ' })
        .expect(422)
        .expect((res) => expect(res.body.violations).toBeDefined());
    });
  });

  describe('Крайние сценарии: получение', () => {
    it('GET /publishers/:id с несуществующим UUID возвращает 404', () => {
      return request(app.getHttpServer())
        .get('/publishers/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(404);
    });

    it('GET /publishers/:id с невалидным UUID возвращает 404 или 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/publishers/not-a-uuid')
        .set('Authorization', `Bearer ${guestToken}`);
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('Крайние сценарии: обновление и удаление', () => {
    it('PUT с пустым fullName возвращает 422', () => {
      return request(app.getHttpServer())
        .put(`/publishers/${testPublisher.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: '   ' })
        .expect(422);
    });

    it('PUT с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .put('/publishers/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: 'Имя' })
        .expect(404);
    });

    it('DELETE с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .delete('/publishers/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Крайние сценарии: список и фильтры', () => {
    it('GET /publishers?sortBy=fullName&sortOrder=ASC возвращает 200', () => {
      return request(app.getHttpServer())
        .get('/publishers?sortBy=fullName&sortOrder=ASC')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /publishers?limit=1 возвращает не более 1', () => {
      return request(app.getHttpServer())
        .get('/publishers?limit=1')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(1);
        });
    });
  });

  describe('Невалидный токен', () => {
    it('GET /publishers с невалидным токеном возвращает 403', () => {
      return request(app.getHttpServer())
        .get('/publishers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
    });

    it('POST /publishers с невалидным токеном возвращает 403', () => {
      return request(app.getHttpServer())
        .post('/publishers')
        .set('Authorization', 'Bearer invalid-token')
        .send({ fullName: 'Имя' })
        .expect(403);
    });
  });
});
