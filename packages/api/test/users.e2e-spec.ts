/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { User, UserRole } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '../src/auth/jwt.service';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';
import { AuthMiddleware } from '../src/auth/auth.middleware';
import { UserBook } from '../src/user-lists/entities/user-book.entity';
import { UserMovie } from '../src/user-lists/entities/user-movie.entity';
import { UserSeries } from '../src/user-lists/entities/user-series.entity';
import { UserGame } from '../src/user-lists/entities/user-game.entity';
import { Book } from '../src/books/entities/book.entity';
import { Author } from '../src/authors/entities/author.entity';
import { Movie } from '../src/movies/entities/movie.entity';
import { ApplicationValidationPipe } from '../src/common/application-validation.pipe';

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
    TypeOrmModule.forFeature([
      UserBook,
      UserMovie,
      UserSeries,
      UserGame,
      Book,
      Author,
    ]),
    AuthModule,
    UsersModule,
  ],
  providers: [AuthMiddleware],
})
class UsersE2ETestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.ALL },
        { path: 'users/(.*)', method: RequestMethod.ALL },
      );
  }
}

describe('Users Module E2E Tests', () => {
  type ApiUser = {
    id: string;
    username: string | null;
    email: string | null;
    role: UserRole;
    isActive: boolean;
  };

  const extractUsers = (body: unknown): ApiUser[] => {
    return body as ApiUser[];
  };

  let app: INestApplication;
  let usersRepository: Repository<User>;
  let jwtService: JwtService;
  let testUser: User;
  let adminUser: User;
  let guestUser: User;
  let inactiveUser: User;
  let numericUsernameUser: User;
  let uuidLikeUsernameUser: User;
  let userToken: string;
  let adminToken: string;
  let guestToken: string;
  let userBooksRepository: Repository<UserBook>;
  let userMoviesRepository: Repository<UserMovie>;
  let userSeriesRepository: Repository<UserSeries>;
  let userGamesRepository: Repository<UserGame>;
  let booksRepository: Repository<Book>;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UsersE2ETestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ApplicationValidationPipe());
    await app.init();

    usersRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);
    userBooksRepository = moduleFixture.get<Repository<UserBook>>(
      getRepositoryToken(UserBook),
    );
    userMoviesRepository = moduleFixture.get<Repository<UserMovie>>(
      getRepositoryToken(UserMovie),
    );
    userSeriesRepository = moduleFixture.get<Repository<UserSeries>>(
      getRepositoryToken(UserSeries),
    );
    userGamesRepository = moduleFixture.get<Repository<UserGame>>(
      getRepositoryToken(UserGame),
    );
    booksRepository = moduleFixture.get<Repository<Book>>(
      getRepositoryToken(Book),
    );

    // Create test users
    testUser = usersRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: '$2b$10$hash',
      role: UserRole.USER,
      isActive: true,
    });

    adminUser = usersRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440002',
      username: 'admin',
      email: 'admin@example.com',
      name: 'ADMINADMIN User',
      passwordHash: '$2b$10$hash',
      role: UserRole.ADMIN,
      isActive: true,
    });

    guestUser = usersRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440003',
      username: 'guest_user',
      email: 'guest@example.com',
      name: 'Guest User',
      passwordHash: '$2b$10$hash',
      role: UserRole.GUEST,
      isActive: true,
    });

    inactiveUser = usersRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440004',
      username: 'inactiveuser',
      email: 'inactive@example.com',
      name: 'Inactive User',
      passwordHash: '$2b$10$hash',
      role: UserRole.USER,
      isActive: false,
    });

    numericUsernameUser = usersRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440005',
      username: '12345',
      email: 'numeric@example.com',
      name: 'Numeric Username',
      passwordHash: '$2b$10$hash',
      role: UserRole.USER,
      isActive: true,
    });

    uuidLikeUsernameUser = usersRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440006',
      username: '11111111-1111-4111-8111-111111111111',
      email: 'uuid-like@example.com',
      name: 'UUID-like Username',
      passwordHash: '$2b$10$hash',
      role: UserRole.USER,
      isActive: true,
    });

    await usersRepository.save([
      testUser,
      adminUser,
      guestUser,
      inactiveUser,
      numericUsernameUser,
      uuidLikeUsernameUser,
    ]);

    userToken = jwtService.generateToken(testUser);
    adminToken = jwtService.generateToken(adminUser);
    guestToken = jwtService.generateToken(guestUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users/:identifier', () => {
    it('should get user by UUID', () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testUser.id);
          expect(res.body.username).toBe('testuser');
        });
    });

    it('should get user by username', () => {
      return request(app.getHttpServer())
        .get(`/users/testuser`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe('testuser');
        });
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .expect(401);
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get(`/users/nonexistent`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should get user by numeric username', () => {
      return request(app.getHttpServer())
        .get('/users/12345')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(numericUsernameUser.id);
          expect(res.body.username).toBe('12345');
        });
    });

    it('should prioritize UUID parsing over username for UUID-like identifier', () => {
      return request(app.getHttpServer())
        .get(`/users/${uuidLikeUsernameUser.username}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /users', () => {
    it('should return users for USER role', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('should return array response for list endpoint', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const users = extractUsers(res.body);
          expect(users.length).toBeGreaterThan(0);
        });
    });

    it('should return users for ADMIN role', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should filter by role for ADMIN', () => {
      return request(app.getHttpServer())
        .get('/users?role=ADMIN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should return only active users for USER role', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          const users = extractUsers(res.body);
          expect(users.every((u) => u.isActive)).toBe(true);
          expect(users.some((u) => u.username === 'inactiveuser')).toBe(false);
        });
    });

    it('should return only active users for GUEST role', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          const users = extractUsers(res.body);
          expect(users.every((u) => u.isActive)).toBe(true);
          expect(users.some((u) => u.username === 'inactiveuser')).toBe(false);
        });
    });

    it('should return inactive users for ADMIN when isActive=false is provided', () => {
      return request(app.getHttpServer())
        .get('/users?isActive=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const users = extractUsers(res.body);
          expect(users.length).toBeGreaterThan(0);
          expect(users.every((u) => !u.isActive)).toBe(true);
          expect(users.some((u) => u.username === inactiveUser.username)).toBe(
            true,
          );
        });
    });

    it('should ignore isActive filter for non-ADMIN users', () => {
      return request(app.getHttpServer())
        .get('/users?isActive=false')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          const users = extractUsers(res.body);
          expect(users.length).toBeGreaterThan(0);
          expect(users.every((u) => u.isActive)).toBe(true);
          expect(users.some((u) => u.username === inactiveUser.username)).toBe(
            false,
          );
        });
    });

    it('should ignore role filter for non-ADMIN users', () => {
      return request(app.getHttpServer())
        .get('/users?role=ADMIN')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          const users = extractUsers(res.body);
          expect(users.every((u) => u.isActive)).toBe(true);
          expect(users.some((u) => u.role === UserRole.USER)).toBe(true);
        });
    });

    it('should search by name case-insensitive', () => {
      return request(app.getHttpServer())
        .get('/users?search=adminadmin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const users = extractUsers(res.body);
          expect(users.some((u) => u.id === adminUser.id)).toBe(true);
        });
    });

    it('should search by username case-insensitive', () => {
      return request(app.getHttpServer())
        .get('/users?search=GUEST_USER')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const users = extractUsers(res.body);
          expect(users.some((u) => u.id === guestUser.id)).toBe(true);
        });
    });

    it('should search by email case-insensitive', () => {
      return request(app.getHttpServer())
        .get('/users?search=NUMERIC@EXAMPLE.COM')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const users = extractUsers(res.body);
          expect(users.some((u) => u.id === numericUsernameUser.id)).toBe(true);
        });
    });

    it('should return empty list when search has no matches', () => {
      return request(app.getHttpServer())
        .get('/users?search=definitely-no-match')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          const users = extractUsers(res.body);
          expect(users).toHaveLength(0);
        });
    });

    it('should return 422 for invalid boolean isActive filter', () => {
      return request(app.getHttpServer())
        .get('/users?isActive=not-boolean')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(422);
    });
  });

  describe('PATCH /users/:identifier', () => {
    it('should update user as ADMIN', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Name');
          expect(res.body.email).toBe('updated@example.com');
        });
    });

    it('should reject duplicate username', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'admin',
        })
        .expect(422);
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(422);
    });

    it('should return 403 for non-ADMIN user', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Name',
        })
        .expect(403);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .send({
          name: 'New Name',
        })
        .expect(401);
    });
  });

  describe('PATCH /users/:identifier/deactivate', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}/deactivate`)
        .expect(401);
    });

    it('should return 403 for USER role', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}/deactivate`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 403 for GUEST role', () => {
      return request(app.getHttpServer())
        .patch(`/users/${guestUser.id}/deactivate`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('should return 409 when admin tries to deactivate self', () => {
      return request(app.getHttpServer())
        .patch(`/users/${adminUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);
    });

    it('should deactivate user as ADMIN', async () => {
      // Ensure user is active first
      await usersRepository.update(numericUsernameUser.id, { isActive: true });

      await request(app.getHttpServer())
        .patch(`/users/${numericUsernameUser.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.isActive).toBe(false);
          expect(res.body.id).toBe(numericUsernameUser.id);
        });

      // Verify in DB
      const dbUser = await usersRepository.findOne({
        where: { id: numericUsernameUser.id },
      });
      expect(dbUser!.isActive).toBe(false);

      // Restore for other tests
      await usersRepository.update(numericUsernameUser.id, { isActive: true });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .patch('/users/00000000-0000-4000-8000-000000000099/deactivate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('DELETE /users/:identifier', () => {
    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/users/${testUser.id}`)
        .expect(401);
    });

    it('should return 403 for non-ADMIN user', () => {
      return request(app.getHttpServer())
        .delete(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should return 403 for GUEST role', () => {
      return request(app.getHttpServer())
        .delete(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('should return 409 when admin tries to delete self', () => {
      return request(app.getHttpServer())
        .delete(`/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(409);
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .delete('/users/00000000-0000-4000-8000-000000000099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should hard-delete user and cascade-remove all user-entities', async () => {
      // Create a disposable user
      const victim = usersRepository.create({
        id: '550e8400-e29b-41d4-a716-446655440099',
        username: 'victim_user',
        email: 'victim@example.com',
        name: 'Victim User',
        passwordHash: '$2b$10$hash',
        role: UserRole.USER,
        isActive: true,
      });
      await usersRepository.save(victim);

      // Create a book for user_books FK
      const book = booksRepository.create({
        id: '660e8400-e29b-41d4-a716-446655440001',
        title: 'Test Book',
      });
      await booksRepository.save(book);

      // Create user-entities for the victim
      await userBooksRepository.save(
        userBooksRepository.create({
          userId: victim.id,
          bookId: book.id,
          rating: 80,
          comment: null,
          readAt: null,
        }),
      );
      const moviesRepository =
        userMoviesRepository.manager.getRepository(Movie);
      const movie = await moviesRepository.save(
        moviesRepository.create({ title: 'Test Movie' }),
      );
      await userMoviesRepository.save(
        userMoviesRepository.create({
          userId: victim.id,
          movieId: movie.id,
          rating: 70,
          comment: null,
        }),
      );
      await userSeriesRepository.save(
        userSeriesRepository.create({
          userId: victim.id,
          seriesId: '880e8400-e29b-41d4-a716-446655440001',
          rating: 60,
          comment: null,
        }),
      );
      await userGamesRepository.save(
        userGamesRepository.create({
          userId: victim.id,
          gameId: '990e8400-e29b-41d4-a716-446655440001',
          rating: 50,
          comment: null,
        }),
      );

      // Verify entities exist
      expect(
        await userBooksRepository.count({ where: { userId: victim.id } }),
      ).toBe(1);
      expect(
        await userMoviesRepository.count({ where: { userId: victim.id } }),
      ).toBe(1);
      expect(
        await userSeriesRepository.count({ where: { userId: victim.id } }),
      ).toBe(1);
      expect(
        await userGamesRepository.count({ where: { userId: victim.id } }),
      ).toBe(1);

      // Delete the user
      await request(app.getHttpServer())
        .delete(`/users/${victim.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // User should be gone
      const deletedUser = await usersRepository.findOne({
        where: { id: victim.id },
      });
      expect(deletedUser).toBeNull();

      // All user-entities should be gone
      expect(
        await userBooksRepository.count({ where: { userId: victim.id } }),
      ).toBe(0);
      expect(
        await userMoviesRepository.count({ where: { userId: victim.id } }),
      ).toBe(0);
      expect(
        await userSeriesRepository.count({ where: { userId: victim.id } }),
      ).toBe(0);
      expect(
        await userGamesRepository.count({ where: { userId: victim.id } }),
      ).toBe(0);
    });
  });

  describe('PATCH /users/:identifier/role', () => {
    it('should change user role as ADMIN', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: UserRole.ADMIN,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.role).toBe(UserRole.ADMIN);
        });
    });

    it('should reject invalid role', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'INVALID',
        })
        .expect(422);
    });

    it('should return 403 for non-ADMIN user', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: UserRole.ADMIN,
        })
        .expect(403);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}/role`)
        .send({
          role: UserRole.ADMIN,
        })
        .expect(401);
    });
  });

  describe('Admin User Management Flow', () => {
    it('should list all users for ADMIN', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should change user role as ADMIN', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: UserRole.USER,
        })
        .expect(200);
    });
  });

  describe('Role-Based Access Control', () => {
    it('USER should not access admin endpoints', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New Name',
        })
        .expect(403);
    });

    it('ADMIN should access all endpoints', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Validation and Error Handling', () => {
    it('should validate email format', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(422);
    });

    it('should validate username format', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'invalid-user!',
        })
        .expect(422);
    });

    it('should handle missing user gracefully', () => {
      return request(app.getHttpServer())
        .get('/users/nonexistent-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
