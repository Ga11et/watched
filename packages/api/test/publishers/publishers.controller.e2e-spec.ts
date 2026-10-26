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
import { Publisher } from '../../src/publishers/entities/publisher.entity';
import { Game } from '../../src/games/entities/game.entity';
import { Developer } from '../../src/developers/entities/developer.entity';
import { Book } from '../../src/books/entities/book.entity';
import { Author } from '../../src/authors/entities/author.entity';
import { GuestAccount1793042069400 } from '../../src/database/migrations/1793042069400-GuestAccount';

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
class PublishersControllerTestModule implements NestModule {
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
      );
  }
}

describe('PublishersController (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let userToken: string;
  let originalJwtSecret: string | undefined;

  beforeAll(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'publishers-controller-e2e-secret';

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture = await Test.createTestingModule({
      imports: [PublishersControllerTestModule],
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
        username: 'publishers_admin',
        email: 'publishers_admin@test.dev',
        passwordHash: 'hash',
        role: UserRole.ADMIN,
        isActive: true,
      }),
      usersRepository.create({
        name: 'User',
        username: 'publishers_user',
        email: 'publishers_user@test.dev',
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
    const pending = request(app.getHttpServer()).post('/publishers');

    return (
      token ? pending.set('Authorization', `Bearer ${token}`) : pending
    ).send(body);
  };

  describe('POST /publishers', () => {
    it('returns a field violation for a blank fullName', async () => {
      const response = await post({ fullName: '   ' }, adminToken).expect(422);

      expect(response.body).toEqual({
        status: 422,
        message: 'Произошла ошибка при создании издателя',
        violations: { fullName: 'Название издателя обязательно' },
      });
    });

    it('returns empty violations without a token', async () => {
      const response = await post({ fullName: 'Valid' }).expect(401);

      expect(response.body).toEqual({
        status: 401,
        message: 'Authorization token required',
        violations: {},
      });
    });

    it('returns empty violations for a non-admin', async () => {
      const response = await post({ fullName: 'Valid' }, userToken).expect(403);

      expect(response.body).toEqual({
        status: 403,
        message: 'Admin access required',
        violations: {},
      });
    });
  });

  describe('PUT /publishers/:id', () => {
    it('returns a field violation for a blank fullName', async () => {
      const created = await post(
        { fullName: 'Before update' },
        adminToken,
      ).expect(201);

      const response = await request(app.getHttpServer())
        .put(`/publishers/${(created.body as { id: string }).id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: '   ' })
        .expect(422);

      expect(response.body).toEqual({
        status: 422,
        message: 'Произошла ошибка при обновлении издателя',
        violations: { fullName: 'Название издателя не может быть пустым' },
      });
    });
  });

  describe('GET /publishers/:id', () => {
    it('returns empty violations when the record is missing', async () => {
      const response = await request(app.getHttpServer())
        .get(`/publishers/${MISSING_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: `Издатель с ID ${MISSING_ID} не найден`,
        violations: {},
      });
    });
  });

  describe('Токен из POST /auth/guest', () => {
    let guestAccountToken: string;

    beforeAll(async () => {
      const queryRunner = app.get(DataSource).createQueryRunner();

      try {
        await new GuestAccount1793042069400().up(queryRunner);
      } finally {
        await queryRunner.release();
      }

      const response = await request(app.getHttpServer())
        .post('/auth/guest')
        .expect(200);
      guestAccountToken = response.body.token;
    });

    it('GET /publishers возвращает 200, POST /publishers возвращает 403', async () => {
      await request(app.getHttpServer())
        .get('/publishers')
        .set('Authorization', `Bearer ${guestAccountToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .post('/publishers')
        .set('Authorization', `Bearer ${guestAccountToken}`)
        .send({})
        .expect(403);
    });
  });
});

/**
 * E2E тесты модуля publishers.
 * Публичных эндпоинтов нет: все GET защищены как минимум ролью GUEST.
 */

@Module({
  imports: [
    TypeOrmModule.forRoot(e2eDbConfig),
    TypeOrmModule.forFeature([Game, Developer, Book, Author]),
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
    it('GET /publishers с невалидным токеном возвращает 401', () => {
      return request(app.getHttpServer())
        .get('/publishers')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('POST /publishers с невалидным токеном возвращает 401', () => {
      return request(app.getHttpServer())
        .post('/publishers')
        .set('Authorization', 'Bearer invalid-token')
        .send({ fullName: 'Имя' })
        .expect(401);
    });
  });
});
