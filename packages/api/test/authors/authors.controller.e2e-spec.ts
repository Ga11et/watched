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
import { Author } from '../../src/authors/entities/author.entity';
import { Book } from '../../src/books/entities/book.entity';
import { UserBook } from '../../src/user-lists/entities/user-book.entity';

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
class AuthorsControllerTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'authors', method: RequestMethod.GET },
        { path: 'authors/(.*)', method: RequestMethod.GET },
      );
    consumer
      .apply(AuthMiddleware, AdminMiddleware)
      .forRoutes(
        { path: 'authors', method: RequestMethod.POST },
        { path: 'authors/:id', method: RequestMethod.PUT },
      );
  }
}

describe('AuthorsController (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let userToken: string;
  let originalJwtSecret: string | undefined;

  beforeAll(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'authors-controller-e2e-secret';

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture = await Test.createTestingModule({
      imports: [AuthorsControllerTestModule],
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
        username: 'authors_admin',
        email: 'authors_admin@test.dev',
        passwordHash: 'hash',
        role: UserRole.ADMIN,
        isActive: true,
      }),
      usersRepository.create({
        name: 'User',
        username: 'authors_user',
        email: 'authors_user@test.dev',
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
    const pending = request(app.getHttpServer()).post('/authors');

    return (
      token ? pending.set('Authorization', `Bearer ${token}`) : pending
    ).send(body);
  };

  describe('POST /authors', () => {
    it('returns a field violation for a blank fullName', async () => {
      const response = await post({ fullName: '   ' }, adminToken).expect(422);

      expect(response.body).toEqual({
        status: 422,
        message: 'Произошла ошибка при создании автора',
        violations: { fullName: 'Имя автора обязательно' },
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

  describe('PUT /authors/:id', () => {
    it('returns a field violation for a blank fullName', async () => {
      const created = await post(
        { fullName: 'Before update' },
        adminToken,
      ).expect(201);

      const response = await request(app.getHttpServer())
        .put(`/authors/${(created.body as { id: string }).id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: '   ' })
        .expect(422);

      expect(response.body).toEqual({
        status: 422,
        message: 'Произошла ошибка при обновлении автора',
        violations: { fullName: 'Имя автора не может быть пустым' },
      });
    });
  });

  describe('GET /authors/:id', () => {
    it('returns empty violations when the record is missing', async () => {
      const response = await request(app.getHttpServer())
        .get(`/authors/${MISSING_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: `Автор с ID ${MISSING_ID} не найден`,
        violations: {},
      });
    });
  });
});

/**
 * E2E тесты модуля authors.
 * Публичных эндпоинтов нет: все GET защищены как минимум ролью GUEST.
 * Запуск: pnpm test:api:e2e -- test/authors/authors.controller.e2e-spec.ts
 * Тестовая БД поднимается автоматически.
 */

@Module({
  imports: [
    TypeOrmModule.forRoot(e2eDbConfig),
    TypeOrmModule.forFeature([Book, UserBook]),
    AuthModule,
    UsersModule,
    AuthorsModule,
  ],
  providers: [AuthMiddleware, AdminMiddleware],
})
class AuthorsE2ETestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'authors', method: RequestMethod.GET },
        { path: 'authors/(.*)', method: RequestMethod.GET },
      );
    consumer
      .apply(AuthMiddleware, AdminMiddleware)
      .forRoutes(
        { path: 'authors', method: RequestMethod.POST },
        { path: 'authors/:id', method: RequestMethod.PUT },
        { path: 'authors/:id', method: RequestMethod.DELETE },
      );
  }
}

describe('Authors Module E2E Tests', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let authorsRepository: Repository<Author>;
  let jwtService: JwtService;

  let adminToken: string;
  let userToken: string;
  let guestToken: string;
  let testAuthor: Author;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-authors-e2e';

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthorsE2ETestModule],
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
    authorsRepository = moduleFixture.get(getRepositoryToken(Author));
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

    testAuthor = authorsRepository.create({
      id: '660e8400-e29b-41d4-a716-446655440001',
      fullName: 'Лев Толстой',
      comment: null,
      photo: null,
    });
    await authorsRepository.save(testAuthor);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Доступ по ролям: GET (только для авторизованных, в т.ч. GUEST)', () => {
    it('GET /authors без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/authors').expect(401);
    });

    it('GET /authors/stats без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/authors/stats').expect(401);
    });

    it('GET /authors/search без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .get('/authors/search?q=Толстой')
        .expect(401);
    });

    it('GET /authors/:id без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .get(`/authors/${testAuthor.id}`)
        .expect(401);
    });

    it('GET /authors с токеном GUEST возвращает 200 и массив', () => {
      return request(app.getHttpServer())
        .get('/authors')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /authors/stats с токеном GUEST возвращает 200 и total', () => {
      return request(app.getHttpServer())
        .get('/authors/stats')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(typeof res.body.total).toBe('number');
        });
    });

    it('GET /authors/search?q= с токеном GUEST возвращает 200', () => {
      return request(app.getHttpServer())
        .get('/authors/search?q=Толстой')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /authors/:id с токеном GUEST возвращает 200', () => {
      return request(app.getHttpServer())
        .get(`/authors/${testAuthor.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testAuthor.id);
          expect(res.body.fullName).toBe(testAuthor.fullName);
        });
    });

    it('GET /authors с токеном USER и ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .get('/authors')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/authors')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Доступ по ролям: POST /authors', () => {
    it('POST /authors без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .post('/authors')
        .send({ fullName: 'Новый автор' })
        .expect(401);
    });

    it('POST /authors с ролью USER возвращает 403', () => {
      return request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ fullName: 'Автор от юзера' })
        .expect(403);
    });

    it('POST /authors с ролью GUEST возвращает 403', () => {
      return request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ fullName: 'Автор от гостя' })
        .expect(403);
    });

    it('POST /authors с ролью ADMIN возвращает 201', () => {
      return request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: 'Фёдор Достоевский', comment: 'Классик' })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.fullName).toBe('Фёдор Достоевский');
          expect(res.body.comment).toBe('Классик');
        });
    });
  });

  describe('Доступ по ролям: PUT /authors/:id', () => {
    it('PUT без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .put(`/authors/${testAuthor.id}`)
        .send({ fullName: 'Обновлено' })
        .expect(401);
    });

    it('PUT с ролью USER возвращает 403', () => {
      return request(app.getHttpServer())
        .put(`/authors/${testAuthor.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ fullName: 'Обновлено' })
        .expect(403);
    });

    it('PUT с ролью GUEST возвращает 403', () => {
      return request(app.getHttpServer())
        .put(`/authors/${testAuthor.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ fullName: 'Обновлено' })
        .expect(403);
    });

    it('PUT с ролью ADMIN возвращает 200', async () => {
      await request(app.getHttpServer())
        .put(`/authors/${testAuthor.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fullName: 'Лев Николаевич Толстой',
          comment: 'Обновлённый комментарий',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.fullName).toBe('Лев Николаевич Толстой');
        });
      await authorsRepository.update(testAuthor.id, {
        fullName: testAuthor.fullName,
        comment: testAuthor.comment,
      });
    });
  });

  describe('Доступ по ролям: DELETE /authors/:id', () => {
    let authorToDelete: Author;

    beforeAll(async () => {
      authorToDelete = authorsRepository.create({
        fullName: 'Автор на удаление',
      });
      await authorsRepository.save(authorToDelete);
    });

    it('DELETE без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .delete(`/authors/${authorToDelete.id}`)
        .expect(401);
    });

    it('DELETE с USER/GUEST возвращает 403', async () => {
      await request(app.getHttpServer())
        .delete(`/authors/${authorToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      await request(app.getHttpServer())
        .delete(`/authors/${authorToDelete.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('DELETE с ADMIN возвращает 200 и удаляет', async () => {
      await request(app.getHttpServer())
        .delete(`/authors/${authorToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const found = await authorsRepository.findOne({
        where: { id: authorToDelete.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('Крайние сценарии: создание', () => {
    it('POST с пустым fullName возвращает 422 и violations', () => {
      return request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: '   ' })
        .expect(422)
        .expect((res) => {
          expect(res.body.violations).toEqual({
            fullName: 'Имя автора обязательно',
          });
        });
    });

    it('POST без fullName (пустое тело) возвращает 422', async () => {
      const res = await request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(422);
    });
  });

  describe('Крайние сценарии: получение', () => {
    it('GET /authors/:id с несуществующим UUID возвращает 404', () => {
      return request(app.getHttpServer())
        .get('/authors/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(404);
    });

    it('GET /authors/:id с невалидным UUID возвращает 404 или 400', async () => {
      const res = await request(app.getHttpServer())
        .get('/authors/not-a-uuid')
        .set('Authorization', `Bearer ${guestToken}`);
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('Крайние сценарии: обновление', () => {
    it('PUT с пустым fullName возвращает 422', () => {
      return request(app.getHttpServer())
        .put(`/authors/${testAuthor.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: '   ' })
        .expect(422);
    });

    it('PUT с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .put('/authors/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullName: 'Имя' })
        .expect(404);
    });
  });

  describe('Крайние сценарии: удаление', () => {
    it('DELETE с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .delete('/authors/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Крайние сценарии: список и фильтры', () => {
    it('GET /authors?sortBy=fullName&sortOrder=ASC возвращает 200', () => {
      return request(app.getHttpServer())
        .get('/authors?sortBy=fullName&sortOrder=ASC')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });

    it('GET /authors?limit=1 возвращает не более 1', () => {
      return request(app.getHttpServer())
        .get('/authors?limit=1')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(1);
        });
    });

    it('GET /authors/search?q=пустой поиск возвращает массив', () => {
      return request(app.getHttpServer())
        .get('/authors/search?q=неттакого')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => expect(Array.isArray(res.body)).toBe(true));
    });
  });

  describe('Невалидный токен', () => {
    it('POST /authors с невалидным токеном возвращает 401', () => {
      return request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', 'Bearer invalid-token')
        .send({ fullName: 'Имя' })
        .expect(401);
    });

    it('GET /authors с невалидным токеном возвращает 401', () => {
      return request(app.getHttpServer())
        .get('/authors')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
