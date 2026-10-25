import {
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
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
        violations: [{ field: 'fullName', error: 'Имя автора обязательно' }],
      });
    });

    it('returns empty violations without a token', async () => {
      const response = await post({ fullName: 'Valid' }).expect(401);

      expect(response.body).toEqual({
        status: 401,
        message: 'Authorization token required',
        violations: [],
      });
    });

    it('returns empty violations for a non-admin', async () => {
      const response = await post({ fullName: 'Valid' }, userToken).expect(403);

      expect(response.body).toEqual({
        status: 403,
        message: 'Admin access required',
        violations: [],
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
        violations: [
          { field: 'fullName', error: 'Имя автора не может быть пустым' },
        ],
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
        violations: [],
      });
    });
  });
});
