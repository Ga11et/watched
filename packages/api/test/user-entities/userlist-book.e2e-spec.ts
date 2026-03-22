/* eslint-disable @typescript-eslint/no-unsafe-argument */
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
import { APP_FILTER } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { AuthModule } from '../../src/auth/auth.module';
import { ApiExceptionFilter } from '../../src/auth/api-exception.filter';
import { AuthMiddleware } from '../../src/auth/auth.middleware';
import { JwtService } from '../../src/auth/jwt.service';
import { UserListsModule } from '../../src/user-lists/user-lists.module';
import { UserBook } from '../../src/user-lists/entities/user-book.entity';
import { User, UserRole } from '../../src/users/entities/user.entity';
import { UsersModule } from '../../src/users/users.module';
import { Book } from '../../src/books/entities/book.entity';
import { BooksModule } from '../../src/books/books.module';
import { AuthorsModule } from '../../src/authors/authors.module';
import { Author } from '../../src/authors/entities/author.entity';

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
  admin: '550e8400-e29b-41d4-a716-446655440001',
  user: '550e8400-e29b-41d4-a716-446655440002',
  otherUser: '550e8400-e29b-41d4-a716-446655440003',
  guest: '550e8400-e29b-41d4-a716-446655440004',
  bookA: '770e8400-e29b-41d4-a716-446655440001',
  bookB: '770e8400-e29b-41d4-a716-446655440002',
  bookC: '770e8400-e29b-41d4-a716-446655440003',
  unknownRecord: '999e8400-e29b-41d4-a716-446655440999',
};

@Module({
  imports: [
    TypeOrmModule.forRoot(e2eDbConfig),
    TypeOrmModule.forFeature([BooksModule, AuthorsModule]),
    AuthModule,
    UsersModule,
    UserListsModule,
  ],
  providers: [
    AuthMiddleware,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
class UserListBookE2ETestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'user-books', method: RequestMethod.ALL },
        { path: 'user-books/(.*)', method: RequestMethod.ALL },
      );
  }
}

describe('UserList-Book module (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let userBooksRepository: Repository<UserBook>;
  let booksRepository: Repository<Book>;
  let authorsRepository: Repository<Author>;
  let jwtService: JwtService;

  let adminUser: User;
  let regularUser: User;
  let otherUser: User;
  let guestUser: User;

  let adminToken: string;
  let userToken: string;
  let otherUserToken: string;
  let guestToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-userlist-book-e2e';
    jest.setTimeout(20000);

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserListBookE2ETestModule],
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
    userBooksRepository = moduleFixture.get(getRepositoryToken(UserBook));
    booksRepository = moduleFixture.get(getRepositoryToken(Book));
    authorsRepository = dataSource.getRepository(Author);
    jwtService = moduleFixture.get(JwtService);

    [adminUser, regularUser, otherUser, guestUser] = await usersRepository.save(
      [
        usersRepository.create({
          id: IDS.admin,
          username: 'admin-userlist-book',
          email: 'admin-userlist-book@example.com',
          name: 'Admin',
          passwordHash: '$2b$10$hash',
          role: UserRole.ADMIN,
          isActive: true,
        }),
        usersRepository.create({
          id: IDS.user,
          username: 'user-userlist-book',
          email: 'user-userlist-book@example.com',
          name: 'Regular User',
          passwordHash: '$2b$10$hash',
          role: UserRole.USER,
          isActive: true,
        }),
        usersRepository.create({
          id: IDS.otherUser,
          username: 'other-userlist-book',
          email: 'other-userlist-book@example.com',
          name: 'Other User',
          passwordHash: '$2b$10$hash',
          role: UserRole.USER,
          isActive: true,
        }),
        usersRepository.create({
          id: IDS.guest,
          username: 'guest-userlist-book',
          email: 'guest-userlist-book@example.com',
          name: 'Guest',
          passwordHash: '$2b$10$hash',
          role: UserRole.GUEST,
          isActive: true,
        }),
      ],
    );

    adminToken = jwtService.generateToken(adminUser);
    userToken = jwtService.generateToken(regularUser);
    otherUserToken = jwtService.generateToken(otherUser);
    guestToken = jwtService.generateToken(guestUser);

    await booksRepository.save([
      booksRepository.create({
        id: IDS.bookA,
        title: 'book A',
        publishYear: 2010,
        pageCount: 100,
      }),
      booksRepository.create({
        id: IDS.bookB,
        title: 'book B',
        publishYear: 2011,
        pageCount: 200,
      }),
    ]);
  });

  beforeEach(async () => {
    await userBooksRepository.clear();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('permissions', () => {
    it('returns 401 for protected endpoints without token', async () => {
      await request(app.getHttpServer()).get('/user-books').expect(401);
      await request(app.getHttpServer())
        .post('/user-books')
        .send({ bookId: IDS.bookA })
        .expect(401);
      await request(app.getHttpServer())
        .put(`/user-books/${IDS.unknownRecord}`)
        .send({ comment: 'x' })
        .expect(401);
      await request(app.getHttpServer())
        .delete(`/user-books/${IDS.unknownRecord}`)
        .expect(401);
    });

    it('returns 403 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/user-books')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', 'Bearer invalid-token')
        .send({ bookId: IDS.bookA })
        .expect(403);
    });

    it('allows USER to CRUD own records', async () => {
      const created = await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'test',
          rating: 80,
          readAt: '2026-02-01T10:00:00.000Z',
          comment: 'First read',
        })
        .expect(201);

      expect(created.body.userId).toBe(regularUser.id);

      await request(app.getHttpServer())
        .put(`/user-books/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 95, comment: 'Updated comment' })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(created.body.id);
          expect(res.body.rating).toBe(95);
          expect(res.body.comment).toBe('Updated comment');
        });

      await request(app.getHttpServer())
        .delete(`/user-books/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => expect(res.body.id).toBe(created.body.id));
    });

    it('denies GUEST to mutate and read own list', async () => {
      await request(app.getHttpServer())
        .get('/user-books')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ bookId: IDS.bookA })
        .expect(403);
    });

    it('denies USER to update/delete someone else record', async () => {
      const foreignRecord = await userBooksRepository.save(
        userBooksRepository.create({
          userId: otherUser.id,
          bookId: IDS.bookA,
          rating: 50,
          readAt: null,
          comment: null,
        }),
      );

      await request(app.getHttpServer())
        .put(`/user-books/${foreignRecord.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 60 })
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/user-books/${foreignRecord.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('allows ADMIN to update/delete someone else record', async () => {
      const foreignRecord = await userBooksRepository.save(
        userBooksRepository.create({
          userId: otherUser.id,
          bookId: IDS.bookA,
          rating: 40,
          readAt: null,
          comment: 'Admin target',
        }),
      );

      await request(app.getHttpServer())
        .put(`/user-books/${foreignRecord.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rating: 88, comment: 'Admin edited' })
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(foreignRecord.id);
          expect(res.body.rating).toBe(88);
        });

      await request(app.getHttpServer())
        .delete(`/user-books/${foreignRecord.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('crud operations', () => {
    let putScenarioUserBookPayload: {
      userId: string;
      bookId: string;
      rating: number;
      readAt: string;
      comment: string;
    };

    beforeAll(async () => {
      const createdBook = await booksRepository.save(
        booksRepository.create({
          id: IDS.bookC,
          title: 'Public payload book',
          genre: 'Sci-Fi',
          rating: 91,
          readAt: null,
          pageCount: 512,
          comment: 'Public endpoint book entity comment',
          publishYear: 2020,
          cover: '/uploads/books/public-book.jpg',
          authorId: null,
        }),
      );

      putScenarioUserBookPayload = {
        userId: regularUser.id,
        bookId: createdBook.id,
        rating: 87,
        readAt: '1704067200000',
        comment: 'Public endpoint field check',
      };
    });

    it('GET /user-books returns current user records only', async () => {
      await userBooksRepository.save([
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: IDS.bookA,
          rating: 70,
          readAt: null,
          comment: 'Mine',
        }),
        userBooksRepository.create({
          userId: otherUser.id,
          bookId: IDS.bookB,
          rating: 90,
          readAt: null,
          comment: 'Not mine',
        }),
      ]);

      await request(app.getHttpServer())
        .get('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].userId).toBe(regularUser.id);
        });
    });

    it('GET /user-books returns expected fields for user-book item', async () => {
      const createdBook = await booksRepository.save(
        booksRepository.create({
          id: IDS.bookC,
          title: 'Book with full payload',
          genre: 'Fantasy',
          rating: 99,
          readAt: null,
          pageCount: 777,
          comment: 'Book entity comment',
          publishYear: 2024,
          cover: '/uploads/books/book-a.jpg',
          authorId: null,
        }),
      );

      const createdUserBook = await userBooksRepository.save(
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: createdBook.id,
          rating: 95,
          readAt: '1704067200000',
          comment: 'Field check',
        }),
      );

      await request(app.getHttpServer())
        .get('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);

          const item = res.body[0];

          expect(item).toEqual(
            expect.objectContaining({
              id: createdUserBook.id,
              userId: regularUser.id,
              bookId: createdBook.id,
              rating: 95,
              readAt: expect.any(String),
              comment: 'Field check',
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              book: expect.objectContaining({
                id: createdBook.id,
                title: 'Book with full payload',
                genre: 'Fantasy',
                rating: 99,
                readAt: null,
                pageCount: 777,
                comment: 'Book entity comment',
                publishYear: 2024,
                cover: '/uploads/books/book-a.jpg',
                authorId: null,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            }),
          );
        });
    });

    it('GET /user-books/:guid returns expected fields for requested user', async () => {
      const createdAuthor = await authorsRepository.save(
        authorsRepository.create({
          fullName: 'Author for user-book payload',
          comment: 'Author payload check',
          photo: null,
        }),
      );

      const createdBook = await booksRepository.save(
        booksRepository.create({
          title: 'Public payload book',
          genre: 'Sci-Fi',
          rating: 91,
          readAt: null,
          pageCount: 512,
          comment: 'Public endpoint book entity comment',
          publishYear: 2020,
          cover: '/uploads/books/public-book.jpg',
          authorId: createdAuthor.id,
        }),
      );

      const createdUserBook = await userBooksRepository.save(
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: createdBook.id,
          rating: 87,
          readAt: '1704067200000',
          comment: 'Public endpoint field check',
        }),
      );

      await request(app.getHttpServer())
        .get(`/user-books/${createdUserBook.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          const book = res.body;
          expect(book).toEqual(
            expect.objectContaining({
              id: createdUserBook.id,
              userId: regularUser.id,
              bookId: createdBook.id,
              rating: 87,
              readAt: expect.any(String),
              comment: 'Public endpoint field check',
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              book: expect.objectContaining({
                id: createdBook.id,
                title: 'Public payload book',
                genre: 'Sci-Fi',
                rating: 91,
                readAt: null,
                pageCount: 512,
                comment: 'Public endpoint book entity comment',
                publishYear: 2020,
                cover: '/uploads/books/public-book.jpg',
                authorId: createdAuthor.id,
                author: expect.objectContaining({
                  id: createdAuthor.id,
                  fullName: 'Author for user-book payload',
                  comment: 'Author payload check',
                  photo: null,
                }),
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
              }),
            }),
          );
        });
    });

    it('POST creates record in db', async () => {
      const created = await booksRepository.save(
        booksRepository.create({
          id: IDS.bookA,
          title: 'book A',
          publishYear: 2010,
          pageCount: 100,
        }),
      );

      const response = await request(app.getHttpServer())
        .post(`/user-books`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'book A', rating: 88, comment: 'created book' })
        .expect(201);

      const found = await userBooksRepository.findOne({
        where: { id: response.body.id },
      });
      expect(found?.id).toBe(response.body.id);
      expect(found?.bookId).toBe(created.id);
    });

    it('PUT updates record in db', async () => {
      const createdUserBook = await userBooksRepository.save(
        userBooksRepository.create(putScenarioUserBookPayload),
      );

      let book = await request(app.getHttpServer())
        .put(`/user-books/${createdUserBook.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 88 })
        .expect(200);

      let found = await userBooksRepository.findOne({
        where: { id: createdUserBook.id },
      });
      expect(found?.id).toBe(book.body.id);
      expect(found?.rating).toBe(88);

      book = await request(app.getHttpServer())
        .put(`/user-books/${createdUserBook.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ comment: 'new test' })
        .expect(200);

      found = await userBooksRepository.findOne({
        where: { id: createdUserBook.id },
      });
      expect(found?.id).toBe(book.body.id);
      expect(found?.comment).toBe('new test');

      book = await request(app.getHttpServer())
        .put(`/user-books/${createdUserBook.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ readAt: '2026-03-15' })
        .expect(200);

      found = await userBooksRepository.findOne({
        where: { id: createdUserBook.id },
      });
      expect(book.body.id).toBe(found?.id);
      expect(book.body.readAt).toBe(new Date('2026-03-15').toISOString());
    });

    it('DELETE removes record from database', async () => {
      const createdUserBook = await userBooksRepository.save(
        userBooksRepository.create(putScenarioUserBookPayload),
      );

      await request(app.getHttpServer())
        .delete(`/user-books/${createdUserBook.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const userbook = await userBooksRepository.findOne({
        where: { id: createdUserBook.id },
      });
      expect(userbook).toBeNull();

      const book = await booksRepository.findOne({
        where: { id: IDS.bookC },
      });
      expect(book?.id).toBe(IDS.bookC);
    });
  });

  describe('validation errors', () => {
    const expectValidationViolations = (
      res: { body: { violations?: unknown } },
      expectedFields: string[],
    ) => {
      expect(Array.isArray(res.body.violations)).toBe(true);
      expect((res.body.violations as unknown[]).length).toBeGreaterThan(0);

      const violations = res.body.violations as Array<Record<string, unknown>>;

      violations.forEach((violation) => {
        expect(violation).toEqual(
          expect.objectContaining({
            field: expect.any(String),
            error: expect.any(String),
          }),
        );
        expect((violation.error as string).trim().length).toBeGreaterThan(0);
      });

      expectedFields.forEach((expectedField) => {
        const fieldViolation = violations.find(
          (violation) => violation.field === expectedField,
        );
        expect(fieldViolation).toBeDefined();
      });
    };

    it('POST /user-books rejects invalid payload', async () => {
      await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(422)
        .expect((res) => expectValidationViolations(res, ['title']));

      await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 50 })
        .expect(422)
        .expect((res) => expectValidationViolations(res, ['title']));

      await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 101 })
        .expect(422)
        .expect((res) => expectValidationViolations(res, ['rating']));

      await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 88.5 })
        .expect(422)
        .expect((res) => expectValidationViolations(res, ['rating']));

      await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ readAt: 'not-a-date' })
        .expect(422)
        .expect((res) => expectValidationViolations(res, ['readAt']));
    });

    it('PUT /user-books/:id validates route and body', async () => {
      await request(app.getHttpServer())
        .put('/user-books/not-a-uuid')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 50 })
        .expect(422)
        .expect((res) => expectValidationViolations(res, ['id']));

      const created = await userBooksRepository.save(
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: IDS.bookA,
          rating: 10,
          readAt: null,
          comment: null,
        }),
      );

      await request(app.getHttpServer())
        .put(`/user-books/${created.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: -1 })
        .expect(422)
        .expect((res) => expectValidationViolations(res, ['rating']));

      await request(app.getHttpServer())
        .put(`/user-books/${created.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ readAt: 'bad-date' })
        .expect(422)
        .expect((res) => expectValidationViolations(res, ['readAt']));
    });
  });

  describe('edge cases', () => {
    it('returns 404 for update/delete of missing record', async () => {
      await request(app.getHttpServer())
        .put(`/user-books/${IDS.unknownRecord}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 99 })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/user-books/${IDS.unknownRecord}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('public GET /user/:guid/books is accessible without token', async () => {
      await userBooksRepository.save(
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: IDS.bookA,
          rating: 100,
          readAt: null,
          comment: null,
        }),
      );

      await request(app.getHttpServer())
        .get(`/user/${regularUser.id}/books`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].userId).toBe(regularUser.id);
        });
    });

    it('public GET /user/:guid/books returns 400 for invalid guid format', async () => {
      await request(app.getHttpServer())
        .get('/user/not-a-guid/books')
        .expect(400);
    });

    it('supports minimal payload and nullable optional fields', async () => {
      const created = await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'test' })
        .expect(201);

      expect(created.body.rating).toBeNull();
      expect(created.body.readAt).toBeNull();
      expect(created.body.comment).toBeNull();
    });
  });
});
