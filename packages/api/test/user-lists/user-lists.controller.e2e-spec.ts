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
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource, Repository } from 'typeorm';
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
import { APP_FILTER } from '@nestjs/core';
import { UserBook } from '../../src/user-lists/entities/user-book.entity';
import { Book } from '../../src/books/entities/book.entity';
import { Author } from '../../src/authors/entities/author.entity';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Director } from '../../src/directors/entities/director.entity';
import { Movie } from '../../src/movies/entities/movie.entity';
import { UserMovie } from '../../src/user-lists/entities/user-movie.entity';

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
  providers: [AuthMiddleware],
})
class UserListsControllerTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'user-books', method: RequestMethod.ALL },
        { path: 'user-books/(.*)', method: RequestMethod.ALL },
      );
  }
}

describe('UserListsController (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let userToken: string;
  let originalJwtSecret: string | undefined;

  beforeAll(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'user-lists-controller-e2e-secret';

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". Current database is "${e2eDbConfig.database}".`,
      );
    }

    const moduleFixture = await Test.createTestingModule({
      imports: [UserListsControllerTestModule],
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
        username: 'user_lists_admin',
        email: 'user_lists_admin@test.dev',
        passwordHash: 'hash',
        role: UserRole.ADMIN,
        isActive: true,
      }),
      usersRepository.create({
        name: 'User',
        username: 'user_lists_user',
        email: 'user_lists_user@test.dev',
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

  describe('POST /user-books', () => {
    it('returns a field violation for missing authorIds', async () => {
      const response = await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Book with missing author', authorIds: [MISSING_ID] })
        .expect(422);

      expect(response.body).toEqual({
        status: 422,
        message: 'Произошла ошибка при сохранении книги',
        violations: { authorIds: `Авторы не найдены: ${MISSING_ID}` },
      });
    });

    it('returns empty violations without a token', async () => {
      const response = await request(app.getHttpServer())
        .post('/user-books')
        .send({ title: 'Book without token' })
        .expect(401);

      expect(response.body).toEqual({
        status: 401,
        message: 'Authorization token required',
        violations: {},
      });
    });
  });

  describe('GET /user-books/:id', () => {
    it('returns an id violation for a malformed UUID', async () => {
      const response = await request(app.getHttpServer())
        .get('/user-books/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: 'Validation failed (uuid is expected)',
        violations: { id: 'Validation failed (uuid is expected)' },
      });
    });

    it('returns empty violations when the record is missing', async () => {
      const response = await request(app.getHttpServer())
        .get(`/user-books/${MISSING_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: 'UserBook not found',
        violations: {},
      });
    });
  });
});

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
    DirectorsModule,
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

    it('returns 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get('/user-books')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', 'Bearer invalid-token')
        .send({ bookId: IDS.bookA })
        .expect(401);
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
          pageCount: 512,
          comment: 'Public endpoint book entity comment',
          publishYear: 2020,
          cover: '/uploads/books/public-book.jpg',
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
      const createdAuthor = await authorsRepository.save(
        authorsRepository.create({
          fullName: 'Author for user-book payload',
          comment: 'Author payload check',
          photo: null,
        }),
      );

      const createdBook = await booksRepository.save(
        booksRepository.create({
          id: IDS.bookC,
          title: 'Book with full payload',
          genre: 'Fantasy',
          pageCount: 777,
          comment: 'Book entity comment',
          publishYear: 2024,
          cover: '/uploads/books/book-a.jpg',
          authors: [createdAuthor],
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
                pageCount: 777,
                comment: 'Book entity comment',
                publishYear: 2024,
                authors: expect.arrayContaining([
                  expect.objectContaining({
                    id: createdAuthor.id,
                    fullName: 'Author for user-book payload',
                    comment: 'Author payload check',
                    photo: null,
                  }),
                ]),
                cover: '/uploads/books/book-a.jpg',
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
          pageCount: 512,
          comment: 'Public endpoint book entity comment',
          publishYear: 2020,
          cover: '/uploads/books/public-book.jpg',
          authors: [createdAuthor],
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
                pageCount: 512,
                comment: 'Public endpoint book entity comment',
                publishYear: 2020,
                cover: '/uploads/books/public-book.jpg',
                authors: expect.arrayContaining([
                  expect.objectContaining({
                    id: createdAuthor.id,
                    fullName: 'Author for user-book payload',
                    comment: 'Author payload check',
                    photo: null,
                  }),
                ]),
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

    it('POST with created book not changing book fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'book A',
          rating: 55,
          comment: 'should not touch book',
          publishYear: 2000,
          pageCount: 50,
        })
        .expect(201);

      const book = await booksRepository.findOneOrFail({
        where: { id: IDS.bookA },
      });
      expect(book.title).toBe('book A');
      expect(book.publishYear).toBe(2010);
      expect(book.pageCount).toBe(100);

      const userBook = await userBooksRepository.findOneOrFail({
        where: { id: response.body.id },
      });
      expect(userBook.bookId).toBe(IDS.bookA);
    });

    it('POST with uncreated book creates new book entity with used fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'book unknown',
          rating: 33,
          comment: 'should not touch book',
          publishYear: 2000,
          pageCount: 50,
        })
        .expect(201);

      const book = await booksRepository.findOneOrFail({
        where: { id: response.body.book.id },
      });
      expect(book.title).toBe('book unknown');
      expect(book.publishYear).toBe(2000);
      expect(book.pageCount).toBe(50);
      expect(book.comment).toBeNull();

      const userBook = await userBooksRepository.findOneOrFail({
        where: { id: response.body.id },
        relations: { book: { authors: true } },
      });
      expect(userBook.book.id).toBe(response.body.book.id);
      expect(userBook.comment).toBe('should not touch book');
      expect(userBook.rating).toBe(33);
    });

    it('POST with uncreated book and one author assigns author to book', async () => {
      const author = await authorsRepository.save(
        authorsRepository.create({ fullName: 'Single Author' }),
      );

      const response = await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'book with one author',
          rating: 70,
          authorIds: [author.id],
        })
        .expect(201);

      expect(response.body.book.authors).toHaveLength(1);
      expect(response.body.book.authors[0].id).toBe(author.id);
      expect(response.body.book.authors[0].fullName).toBe('Single Author');

      const book = await booksRepository.findOneOrFail({
        where: { id: response.body.book.id },
        relations: { authors: true },
      });
      expect(book.authors).toHaveLength(1);
      expect(book.authors[0].id).toBe(author.id);
    });

    it('POST with uncreated book and two authors assigns both authors to book', async () => {
      const [authorA, authorB] = await authorsRepository.save([
        authorsRepository.create({ fullName: 'Author Alpha' }),
        authorsRepository.create({ fullName: 'Author Beta' }),
      ]);

      const response = await request(app.getHttpServer())
        .post('/user-books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'book with two authors',
          rating: 85,
          authorIds: [authorA.id, authorB.id],
        })
        .expect(201);

      expect(response.body.book.authors).toHaveLength(2);
      const authors = response.body.book.authors as { id: string }[];
      const returnedIds = authors.map((a) => a.id).sort();
      expect(returnedIds).toEqual([authorA.id, authorB.id].sort());

      const book = await booksRepository.findOneOrFail({
        where: { id: response.body.book.id },
        relations: { authors: true },
      });
      expect(book.authors).toHaveLength(2);
      const dbIds = book.authors.map((a) => a.id).sort();
      expect(dbIds).toEqual([authorA.id, authorB.id].sort());
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

    it('PUT does not change any book fields', async () => {
      const createdUserBook = await userBooksRepository.save(
        userBooksRepository.create(putScenarioUserBookPayload),
      );

      const bookBefore = await booksRepository.findOneOrFail({
        where: { id: putScenarioUserBookPayload.bookId },
        relations: { authors: true },
      });

      await request(app.getHttpServer())
        .put(`/user-books/${createdUserBook.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 10,
          comment: 'trying to change book fields',
          title: 'Hacked title',
          genre: 'Hacked genre',
          publishYear: 1999,
          pageCount: 1,
          cover: '/hacked-cover.jpg',
          authorIds: [],
        })
        .expect(200);

      const bookAfter = await booksRepository.findOneOrFail({
        where: { id: putScenarioUserBookPayload.bookId },
        relations: { authors: true },
      });

      expect(bookAfter.title).toBe(bookBefore.title);
      expect(bookAfter.genre).toBe(bookBefore.genre);
      expect(bookAfter.publishYear).toBe(bookBefore.publishYear);
      expect(bookAfter.pageCount).toBe(bookBefore.pageCount);
      expect(bookAfter.cover).toBe(bookBefore.cover);
      expect(bookAfter.authors.map((a) => a.id).sort()).toEqual(
        bookBefore.authors.map((a) => a.id).sort(),
      );
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
      expect(res.body.violations).toEqual(expect.any(Object));
      expect(Array.isArray(res.body.violations)).toBe(false);

      const violations = res.body.violations as Record<string, unknown>;
      expect(Object.keys(violations).length).toBeGreaterThan(0);

      for (const message of Object.values(violations)) {
        expect(message).toEqual(expect.any(String));
        expect((message as string).trim().length).toBeGreaterThan(0);
      }

      for (const expectedField of expectedFields) {
        expect(violations[expectedField]).toEqual(expect.any(String));
      }
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

    it('PUT /user-books/:id returns 404 for invalid resource id and 422 for invalid body', async () => {
      await request(app.getHttpServer())
        .put('/user-books/not-a-uuid')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 50 })
        .expect(404)
        .expect((res) => expect(res.body.message).toBe('Record not found'));

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

    it('public GET /user/:guid/books returns 404 for invalid guid format', async () => {
      await request(app.getHttpServer())
        .get('/user/not-a-guid/books')
        .expect(404);
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

  describe('stats', () => {
    it('returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/user-books/stats').expect(401);
    });

    it('returns 403 for GUEST', async () => {
      await request(app.getHttpServer())
        .get('/user-books/stats')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('returns correct structure with empty state', async () => {
      await request(app.getHttpServer())
        .get('/user-books/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            total: 0,
            thisMonth: 0,
            avgRating: null,
          });
        });
    });

    it('counts only current user records', async () => {
      await userBooksRepository.save([
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: IDS.bookA,
          rating: 80,
          readAt: null,
          comment: null,
        }),
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: IDS.bookB,
          rating: 60,
          readAt: null,
          comment: null,
        }),
        userBooksRepository.create({
          userId: otherUser.id,
          bookId: IDS.bookA,
          rating: 90,
          readAt: null,
          comment: null,
        }),
      ]);

      await request(app.getHttpServer())
        .get('/user-books/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(2);
        });
    });

    it('calculates thisMonth from readAt', async () => {
      const now = new Date();
      const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 15);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);

      await userBooksRepository.save([
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: IDS.bookA,
          rating: 70,
          readAt: thisMonthDate,
          comment: null,
        }),
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: IDS.bookB,
          rating: 50,
          readAt: lastMonthDate,
          comment: null,
        }),
      ]);

      await request(app.getHttpServer())
        .get('/user-books/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(2);
          expect(res.body.thisMonth).toBe(1);
        });
    });

    it('calculates avgRating correctly', async () => {
      await userBooksRepository.save([
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: IDS.bookA,
          rating: 80,
          readAt: null,
          comment: null,
        }),
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: IDS.bookB,
          rating: 60,
          readAt: null,
          comment: null,
        }),
      ]);

      await request(app.getHttpServer())
        .get('/user-books/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.avgRating).toBe(70);
        });
    });

    it('ignores null ratings in avgRating calculation', async () => {
      await userBooksRepository.save([
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: IDS.bookA,
          rating: 90,
          readAt: null,
          comment: null,
        }),
        userBooksRepository.create({
          userId: regularUser.id,
          bookId: IDS.bookB,
          rating: null,
          readAt: null,
          comment: null,
        }),
      ]);

      await request(app.getHttpServer())
        .get('/user-books/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(2);
          expect(res.body.avgRating).toBe(90);
        });
    });
  });
});

const USER_MOVIE_IDS = {
  admin: '150e8400-e29b-41d4-a716-446655440001',
  user: '150e8400-e29b-41d4-a716-446655440002',
  otherUser: '150e8400-e29b-41d4-a716-446655440003',
  guest: '150e8400-e29b-41d4-a716-446655440004',
  movieA: '250e8400-e29b-41d4-a716-446655440001',
  movieB: '250e8400-e29b-41d4-a716-446655440002',
  unknownRecord: '250e8400-e29b-41d4-a716-446655449999',
};

const MOVIE_READ_ROUTES = [
  { name: 'current user list', path: () => '/user-movies', isList: true },
  {
    name: 'record by id',
    path: (id: string) => `/user-movies/${id}`,
    isList: false,
  },
  {
    name: 'user list by guid',
    path: () => `/user/${USER_MOVIE_IDS.user}/movies`,
    isList: true,
  },
];

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
        { path: 'user-movies', method: RequestMethod.GET },
        { path: 'user-movies/stats', method: RequestMethod.GET },
        { path: 'user-movies', method: RequestMethod.POST },
        { path: 'user-movies/:id', method: RequestMethod.PUT },
        { path: 'user-movies/:id', method: RequestMethod.DELETE },
      );
  }
}

describe('UserList-Movie module (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
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
    app.useGlobalPipes(new ApplicationValidationPipe());
    await app.listen(0, '127.0.0.1');

    dataSource = moduleFixture.get(DataSource);
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
          id: USER_MOVIE_IDS.admin,
          username: 'admin-userlist-movie',
          email: 'admin-userlist-movie@example.com',
          name: 'Admin',
          passwordHash: '$2b$10$hash',
          role: UserRole.ADMIN,
          isActive: true,
        }),
        usersRepository.create({
          id: USER_MOVIE_IDS.user,
          username: 'user-userlist-movie',
          email: 'user-userlist-movie@example.com',
          name: 'Regular User',
          passwordHash: '$2b$10$hash',
          role: UserRole.USER,
          isActive: true,
        }),
        usersRepository.create({
          id: USER_MOVIE_IDS.otherUser,
          username: 'other-userlist-movie',
          email: 'other-userlist-movie@example.com',
          name: 'Other User',
          passwordHash: '$2b$10$hash',
          role: UserRole.USER,
          isActive: true,
        }),
        usersRepository.create({
          id: USER_MOVIE_IDS.guest,
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

    const directorsRepository = moduleFixture.get<Repository<Director>>(
      getRepositoryToken(Director),
    );
    const directors = await directorsRepository.save([
      directorsRepository.create({
        fullName: 'Director A',
        photo: '/uploads/directors/a.jpg',
        comment: 'Catalog biography',
      }),
      directorsRepository.create({
        fullName: 'Director B',
        photo: null,
        comment: null,
      }),
    ]);

    await moviesRepository.save([
      moviesRepository.create({
        id: USER_MOVIE_IDS.movieA,
        title: 'Movie A',
        genre: 'Drama',
        releaseYear: 2020,
        poster: '/uploads/movies/a.jpg',
        directors,
      }),
      moviesRepository.create({
        id: USER_MOVIE_IDS.movieB,
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

  async function expectRejectedWithoutChanges(body: object, status: number) {
    const catalog = await request(app.getHttpServer())
      .get('/movies')
      .expect(200);
    const list = await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send(body)
      .expect(status);
    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200, list.body);
    await request(app.getHttpServer()).get('/movies').expect(200, catalog.body);
  }

  it.each(MOVIE_READ_ROUTES)(
    'returns the full catalog movie in the $name without movieId',
    async ({ path, isList }) => {
      const created = await request(app.getHttpServer())
        .post('/user-movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Movie A',
          rating: 91,
          watchedAt: '2026-02-10T10:00:00.000Z',
          comment: 'Personal review',
        })
        .expect(201);

      const catalog = await request(app.getHttpServer())
        .get(`/movies/${USER_MOVIE_IDS.movieA}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(path(created.body.id))
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          const expected = {
            id: created.body.id,
            userId: USER_MOVIE_IDS.user,
            rating: 91,
            watchedAt: '2026-02-10T10:00:00.000Z',
            comment: 'Personal review',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            movie: {
              id: USER_MOVIE_IDS.movieA,
              title: 'Movie A',
              genre: 'Drama',
              releaseYear: 2020,
              poster: '/uploads/movies/a.jpg',
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              directors: expect.arrayContaining([
                {
                  id: expect.any(String),
                  fullName: 'Director A',
                  photo: '/uploads/directors/a.jpg',
                  comment: 'Catalog biography',
                  createdAt: expect.any(String),
                  updatedAt: expect.any(String),
                },
                {
                  id: expect.any(String),
                  fullName: 'Director B',
                  photo: null,
                  comment: null,
                  createdAt: expect.any(String),
                  updatedAt: expect.any(String),
                },
              ]),
            },
          };
          expect(res.body).toEqual(isList ? [expected] : expected);
          const record = isList ? res.body[0] : res.body;
          expect(record.movie).toEqual(catalog.body);
          expect(record.movie.directors).toHaveLength(2);
        });

      const updated = await request(app.getHttpServer())
        .put(`/user-movies/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 92 })
        .expect(200)
        .expect((res) => {
          expect(res.body.movie).toEqual(catalog.body);
          expect(res.body).not.toHaveProperty('movieId');
          expect(res.body.rating).toBe(92);
          expect(res.body.comment).toBe('Personal review');
          expect(res.body.watchedAt).toBe('2026-02-10T10:00:00.000Z');
        });
      await request(app.getHttpServer())
        .get(`/user-movies/${created.body.id}`)
        .expect(200, updated.body);
    },
  );

  it.each(MOVIE_READ_ROUTES)(
    'preserves null fields and an empty directors array in the $name',
    async ({ path, isList }) => {
      const created = await request(app.getHttpServer())
        .post('/user-movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Movie B' })
        .expect(201);

      await request(app.getHttpServer())
        .get(path(created.body.id))
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          const expected = {
            id: created.body.id,
            userId: USER_MOVIE_IDS.user,
            rating: null,
            watchedAt: null,
            comment: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            movie: {
              id: USER_MOVIE_IDS.movieB,
              title: 'Movie B',
              genre: null,
              releaseYear: null,
              poster: null,
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              directors: [],
            },
          };
          expect(res.body).toEqual(isList ? [expected] : expected);
          expect(created.body).toEqual(expected);
        });
      await request(app.getHttpServer())
        .put(`/user-movies/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 0, comment: '' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            ...created.body,
            rating: 0,
            comment: '',
            updatedAt: expect.any(String),
          });
        });
    },
  );

  it('keeps current user entries newest first when loading multiple catalog movies', async () => {
    const records = await userMoviesRepository.save([
      userMoviesRepository.create({
        userId: USER_MOVIE_IDS.user,
        movieId: USER_MOVIE_IDS.movieA,
        rating: 0,
        comment: '',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      userMoviesRepository.create({
        userId: USER_MOVIE_IDS.user,
        movieId: USER_MOVIE_IDS.movieB,
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
      }),
    ]);

    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([
          expect.objectContaining({
            id: records[1].id,
            movie: expect.objectContaining({
              id: USER_MOVIE_IDS.movieB,
              directors: [],
            }),
          }),
          expect.objectContaining({
            id: records[0].id,
            rating: 0,
            comment: '',
            movie: expect.objectContaining({ id: USER_MOVIE_IDS.movieA }),
          }),
        ]);
      });
  });

  it('keeps lists by guid public and scoped to the requested user', async () => {
    await userMoviesRepository.save([
      userMoviesRepository.create({
        userId: USER_MOVIE_IDS.user,
        movieId: USER_MOVIE_IDS.movieA,
      }),
      userMoviesRepository.create({
        userId: USER_MOVIE_IDS.otherUser,
        movieId: USER_MOVIE_IDS.movieB,
      }),
    ]);

    for (const token of [undefined, userToken, guestToken]) {
      const get = request(app.getHttpServer()).get(
        `/user/${USER_MOVIE_IDS.otherUser}/movies`,
      );
      if (token) {
        get.set('Authorization', `Bearer ${token}`);
      }
      await get.expect(200).expect((res) => {
        expect(res.body).toEqual([
          expect.objectContaining({
            userId: USER_MOVIE_IDS.otherUser,
            movie: expect.objectContaining({ id: USER_MOVIE_IDS.movieB }),
          }),
        ]);
      });
    }
  });

  it('returns empty movie lists for users with no entries or an unknown guid', async () => {
    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200, []);
    await request(app.getHttpServer())
      .get(`/user/${USER_MOVIE_IDS.user}/movies`)
      .expect(200, []);
    await request(app.getHttpServer())
      .get(`/user/${USER_MOVIE_IDS.unknownRecord}/movies`)
      .expect(200, []);
  });

  it('creates a user-movie by exact title with the full catalog movie and personal fields', async () => {
    const catalog = await request(app.getHttpServer())
      .get(`/movies/${USER_MOVIE_IDS.movieA}`)
      .expect(200);
    const created = await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Movie A',
        rating: 91,
        watchedAt: '2026-02-10T10:00:00.000Z',
        comment: 'Great one',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toEqual({
          id: expect.any(String),
          userId: USER_MOVIE_IDS.user,
          movie: catalog.body,
          rating: 91,
          comment: 'Great one',
          watchedAt: '2026-02-10T10:00:00.000Z',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      });
    await request(app.getHttpServer())
      .get(`/user-movies/${created.body.id}`)
      .expect(200, created.body);
  });

  it('edits personal fields with rating zero and preserves the catalog movie', async () => {
    const created = await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Movie A', rating: 91, comment: 'Original review' })
      .expect(201);
    const updated = await request(app.getHttpServer())
      .put(`/user-movies/${created.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        rating: 0,
        watchedAt: '2026-10-07T00:00:00.000Z',
        comment: 'Updated review',
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          ...created.body,
          rating: 0,
          watchedAt: '2026-10-07T00:00:00.000Z',
          comment: 'Updated review',
          updatedAt: expect.any(String),
        });
      });
    await request(app.getHttpServer())
      .get(`/user-movies/${created.body.id}`)
      .expect(200, updated.body);
    await request(app.getHttpServer())
      .get(`/movies/${USER_MOVIE_IDS.movieA}`)
      .expect(200, created.body.movie);
  });

  it('clears personal fields with null and preserves fields omitted from PUT', async () => {
    const created = await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Movie A',
        rating: 80,
        watchedAt: '2026-02-10T10:00:00.000Z',
        comment: 'Original review',
      })
      .expect(201);
    await request(app.getHttpServer())
      .put(`/user-movies/${created.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ comment: '' })
      .expect(200)
      .expect((res) => {
        expect(res.body.rating).toBe(80);
        expect(res.body.watchedAt).toBe('2026-02-10T10:00:00.000Z');
        expect(res.body.comment).toBe('');
      });
    const cleared = await request(app.getHttpServer())
      .put(`/user-movies/${created.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: null, watchedAt: null, comment: null })
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({
          ...created.body,
          rating: null,
          watchedAt: null,
          comment: null,
          updatedAt: expect.any(String),
        });
      });
    await request(app.getHttpServer())
      .get(`/user-movies/${created.body.id}`)
      .expect(200, cleared.body);
  });

  it.each([
    { movieId: USER_MOVIE_IDS.movieB },
    { title: 'Changed title' },
    { genre: 'Comedy' },
    { releaseYear: 1999 },
    { directors: [] },
    { directorIds: [] },
    { poster: '/uploads/movies/changed.jpg' },
    { rating: -1 },
    { rating: 101 },
    { rating: 90.5 },
    { watchedAt: '' },
    { watchedAt: 'not-a-date' },
    { comment: 12 },
  ])(
    'rejects invalid personal edits or catalog changes %j without changes',
    async (body) => {
      const created = await request(app.getHttpServer())
        .post('/user-movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Movie A', rating: 80, comment: 'Original review' })
        .expect(201);
      await request(app.getHttpServer())
        .put(`/user-movies/${created.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(body)
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toEqual(expect.any(Array));
        });
      await request(app.getHttpServer())
        .get(`/user-movies/${created.body.id}`)
        .expect(200, created.body);
      await request(app.getHttpServer())
        .get(`/movies/${USER_MOVIE_IDS.movieA}`)
        .expect(200, created.body.movie);
    },
  );

  it('documents exact-title creation and its error responses in Swagger', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    const post = document.paths['/user-movies'].post;
    expect(post?.requestBody).toEqual({
      required: true,
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/CreateUserMovieDto' },
        },
      },
    });
    const schema = document.components?.schemas?.CreateUserMovieDto;
    expect(schema).toEqual({
      type: 'object',
      required: ['title'],
      properties: {
        title: expect.objectContaining({
          type: 'string',
          minLength: 1,
          pattern: '\\S',
        }),
        rating: expect.objectContaining({
          type: 'integer',
          nullable: true,
          minimum: 0,
          maximum: 100,
        }),
        watchedAt: expect.objectContaining({
          type: 'string',
          format: 'date-time',
        }),
        comment: expect.objectContaining({ type: 'string' }),
      },
    });
    expect(post?.responses).toEqual({
      '201': expect.objectContaining({
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UserMovie' },
          },
        },
      }),
      '404': expect.any(Object),
      '409': expect.any(Object),
      '422': expect.any(Object),
    });
  });

  it('preserves rating zero and an empty personal comment when creating by title', async () => {
    await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Movie A', rating: 0, comment: '' })
      .expect(201)
      .expect((res) => {
        expect(res.body.rating).toBe(0);
        expect(res.body.comment).toBe('');
        expect(res.body.watchedAt).toBeNull();
      });
    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([
          expect.objectContaining({ rating: 0, comment: '', watchedAt: null }),
        ]);
      });
  });

  it('matches a catalog title with leading, trailing, and internal whitespace verbatim', async () => {
    const movie = await moviesRepository.save(
      moviesRepository.create({ title: '  Spaced  Movie\t ' }),
    );
    await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: '  Spaced  Movie\t ' })
      .expect(201)
      .expect((res) => {
        expect(res.body.movie.id).toBe(movie.id);
        expect(res.body.movie.title).toBe('  Spaced  Movie\t ');
      });
  });

  it.each([
    'Missing movie',
    'movie a',
    'Movie a',
    ' Movie A',
    'Movie A ',
    'Movie  A',
    'Movie\tA',
    'Movie',
    'Move A',
    'Spaced  Movie',
  ])(
    'returns 404 for nonmatching title %j without creating anything',
    async (title) => {
      await expectRejectedWithoutChanges({ title }, 404);
    },
  );

  it.each([
    { movieId: USER_MOVIE_IDS.movieA },
    { title: 'Movie A', genre: 'Comedy' },
    { title: 'Movie A', releaseYear: 1999 },
    { title: 'Movie A', directorIds: [] },
    { title: 'Movie A', poster: '/uploads/movies/changed.jpg' },
    { title: 'Movie A', extra: true },
    { title: 'Movie A', rating: -1 },
    { title: 'Movie A', rating: 101 },
    { title: 'Movie A', rating: 90.5 },
    { title: 'Movie A', rating: 'invalid' },
    { title: 'Movie A', watchedAt: 'not-a-date' },
    { title: 'Movie A', comment: 12 },
  ])(
    'rejects invalid or forbidden fields %j with 422 and no changes',
    async (body) => {
      await expectRejectedWithoutChanges(body, 422);
    },
  );

  it('returns 422 for validation errors on request bodies', async () => {
    await request(app.getHttpServer())
      .post('/movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Movie A', extra: true })
      .expect(422);
    const created = await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Movie A' })
      .expect(201);
    await request(app.getHttpServer())
      .put(`/user-movies/${created.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 101 })
      .expect(422);
  });

  it('returns 404 for invalid resource UUIDs on read and mutation routes', async () => {
    await request(app.getHttpServer())
      .get('/user-movies/not-a-uuid')
      .expect(404);
    await request(app.getHttpServer())
      .get('/user/not-a-uuid/movies')
      .expect(404);
    for (const token of [userToken, adminToken]) {
      await request(app.getHttpServer())
        .put('/user-movies/not-a-uuid')
        .set('Authorization', `Bearer ${token}`)
        .send({ rating: 50 })
        .expect(404);
      await request(app.getHttpServer())
        .delete('/user-movies/not-a-uuid')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    }
  });

  it.each([
    {},
    { title: '' },
    { title: ' \t\n ' },
    { title: null },
    { title: 123 },
    { title: true },
    { title: ['Movie A'] },
    { title: { value: 'Movie A' } },
  ])('rejects invalid title %j with 422 and no changes', async (body) => {
    await expectRejectedWithoutChanges(body, 422);
  });

  it.each([{ body: [] }, { body: ['Movie A'] }])(
    'rejects non-object body $body with 422 and no changes',
    async ({ body }) => {
      await expectRejectedWithoutChanges(body, 422);
    },
  );

  it('rejects a forbidden movieId alongside a valid title with 422', async () => {
    await expectRejectedWithoutChanges(
      { title: 'Movie A', movieId: USER_MOVIE_IDS.movieA },
      422,
    );
  });

  it('rejects ambiguous exact titles without changing the catalog or user list', async () => {
    await moviesRepository.save([
      moviesRepository.create({ title: 'Ambiguous movie', releaseYear: 2000 }),
      moviesRepository.create({ title: 'Ambiguous movie', releaseYear: 2020 }),
    ]);
    await expectRejectedWithoutChanges({ title: 'Ambiguous movie' }, 409);
  });

  it('enforces one record per (user, movie)', async () => {
    const catalog = await request(app.getHttpServer())
      .get('/movies')
      .expect(200);
    const created = await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Movie A', rating: 60 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Movie A', rating: 80 })
      .expect(409);
    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200, [created.body]);
    await request(app.getHttpServer()).get('/movies').expect(200, catalog.body);
    await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ title: 'Movie A' })
      .expect(201)
      .expect((res) => {
        expect(res.body.userId).toBe(USER_MOVIE_IDS.otherUser);
        expect(res.body.movie.id).toBe(USER_MOVIE_IDS.movieA);
      });
    await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Movie A' })
      .expect(201)
      .expect((res) => {
        expect(res.body.userId).toBe(USER_MOVIE_IDS.admin);
      });
  });

  it('returns 409 for concurrent duplicate additions and preserves one entry', async () => {
    const results = await Promise.all(
      Array.from({ length: 32 }, () =>
        request(app.getHttpServer())
          .post('/user-movies')
          .set('Authorization', `Bearer ${userToken}`)
          .send({ title: 'Movie A' }),
      ),
    );
    expect(results.filter((result) => result.status === 201)).toHaveLength(1);
    expect(results.filter((result) => result.status === 409)).toHaveLength(31);
    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([
          expect.objectContaining({
            movie: expect.objectContaining({ id: USER_MOVIE_IDS.movieA }),
          }),
        ]);
      });
  });

  it('applies role matrix for reading current user movie entries', async () => {
    await userMoviesRepository.save([
      userMoviesRepository.create({
        userId: USER_MOVIE_IDS.user,
        movieId: USER_MOVIE_IDS.movieA,
        rating: 75,
      }),
      userMoviesRepository.create({
        userId: USER_MOVIE_IDS.otherUser,
        movieId: USER_MOVIE_IDS.movieB,
        rating: 30,
      }),
    ]);

    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toEqual(
          expect.objectContaining({
            userId: USER_MOVIE_IDS.user,
            movie: expect.objectContaining({ id: USER_MOVIE_IDS.movieA }),
            rating: 75,
          }),
        );
      });

    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([]);
      });

    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([]);
      });
  });

  it('deletes only the personal movie record and returns an updated list, including an empty list', async () => {
    const deleted = await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Movie A', rating: 80, comment: 'Personal review' })
      .expect(201);
    const remaining = await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Movie B' })
      .expect(201);
    const otherUserRecord = await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ title: 'Movie A', rating: 50 })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/user-movies/${deleted.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200, { id: deleted.body.id });
    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200, [remaining.body]);
    await request(app.getHttpServer())
      .get(`/user-movies/${deleted.body.id}`)
      .expect(404);
    await request(app.getHttpServer())
      .get(`/movies/${USER_MOVIE_IDS.movieA}`)
      .expect(200, deleted.body.movie);
    await request(app.getHttpServer())
      .get(`/user-movies/${otherUserRecord.body.id}`)
      .expect(200, otherUserRecord.body);

    await request(app.getHttpServer())
      .delete(`/user-movies/${remaining.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200, { id: remaining.body.id });
    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200, []);
    await request(app.getHttpServer())
      .get(`/movies/${USER_MOVIE_IDS.movieB}`)
      .expect(200, remaining.body.movie);
  });

  it('preserves the record, list, and catalog movie when deletion is rejected', async () => {
    const created = await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Movie A', rating: 80, comment: 'Keep this review' })
      .expect(201);

    for (const token of [undefined, guestToken, otherUserToken]) {
      const deletion = request(app.getHttpServer()).delete(
        `/user-movies/${created.body.id}`,
      );
      if (token) {
        deletion.set('Authorization', `Bearer ${token}`);
      }
      await deletion.expect(token ? 403 : 401);
      await request(app.getHttpServer())
        .get(`/user-movies/${created.body.id}`)
        .expect(200, created.body);
      await request(app.getHttpServer())
        .get('/user-movies')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200, [created.body]);
      await request(app.getHttpServer())
        .get(`/movies/${USER_MOVIE_IDS.movieA}`)
        .expect(200, created.body.movie);
    }
  });

  it('enforces role behavior for movie mutations', async () => {
    const foreignRecord = await userMoviesRepository.save(
      userMoviesRepository.create({
        userId: USER_MOVIE_IDS.otherUser,
        movieId: USER_MOVIE_IDS.movieB,
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
      .send({ title: 'Movie A', rating: 10 })
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

  it('requires authentication for user-movie endpoints', async () => {
    const ownedRecord = await userMoviesRepository.save(
      userMoviesRepository.create({
        userId: USER_MOVIE_IDS.user,
        movieId: USER_MOVIE_IDS.movieA,
      }),
    );

    await request(app.getHttpServer()).get('/user-movies').expect(401);

    await request(app.getHttpServer())
      .post('/user-movies')
      .send({ title: 'Movie A', rating: 10 })
      .expect(401);

    await request(app.getHttpServer())
      .put(`/user-movies/${ownedRecord.id}`)
      .send({ rating: 10 })
      .expect(401);

    await request(app.getHttpServer())
      .delete(`/user-movies/${ownedRecord.id}`)
      .expect(401);
  });

  it('allows reading a user-movie by id without auth and without ownership checks', async () => {
    const foreignRecord = await userMoviesRepository.save(
      userMoviesRepository.create({
        userId: USER_MOVIE_IDS.otherUser,
        movieId: USER_MOVIE_IDS.movieB,
        rating: 66,
        watchedAt: new Date('2026-02-10T10:00:00.000Z'),
        comment: 'foreign movie entry',
      }),
    );

    await request(app.getHttpServer())
      .get(`/user-movies/${foreignRecord.id}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(
          expect.objectContaining({
            id: foreignRecord.id,
            userId: USER_MOVIE_IDS.otherUser,
            movie: expect.objectContaining({ id: USER_MOVIE_IDS.movieB }),
            rating: 66,
            comment: 'foreign movie entry',
            watchedAt: expect.any(String),
          }),
        );
      });

    await request(app.getHttpServer())
      .get(`/user-movies/${foreignRecord.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/user-movies/${foreignRecord.id}`)
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200);
  });

  it('returns 404 for unknown user-movie id', async () => {
    await request(app.getHttpServer())
      .get(`/user-movies/${USER_MOVIE_IDS.unknownRecord}`)
      .expect(404);
  });

  describe('stats', () => {
    it('returns 401 without token', async () => {
      await request(app.getHttpServer()).get('/user-movies/stats').expect(401);
    });

    it('returns 403 for GUEST', async () => {
      await request(app.getHttpServer())
        .get('/user-movies/stats')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('returns caller-scoped aggregates for USER and ADMIN', async () => {
      const now = new Date();
      const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 15);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);

      await userMoviesRepository.save([
        userMoviesRepository.create({
          userId: USER_MOVIE_IDS.user,
          movieId: USER_MOVIE_IDS.movieA,
          rating: 90,
          watchedAt: thisMonthDate,
          comment: null,
        }),
        userMoviesRepository.create({
          userId: USER_MOVIE_IDS.user,
          movieId: USER_MOVIE_IDS.movieB,
          rating: null,
          watchedAt: lastMonthDate,
          comment: null,
        }),
        userMoviesRepository.create({
          userId: USER_MOVIE_IDS.admin,
          movieId: USER_MOVIE_IDS.movieA,
          rating: 51,
          watchedAt: thisMonthDate,
          comment: null,
        }),
      ]);

      await request(app.getHttpServer())
        .get('/user-movies/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            total: 2,
            thisMonth: 1,
            avgRating: 90,
          });
        });

      await request(app.getHttpServer())
        .get('/user-movies/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            total: 1,
            thisMonth: 1,
            avgRating: 51,
          });
        });
    });
  });

  it('preserves split-model schema and ownership boundaries for movies', async () => {
    const movieColumns = await dataSource.query<
      Array<{ column_name: string }>
    >(`
      SELECT "column_name"
      FROM "information_schema"."columns"
      WHERE "table_schema" = 'public' AND "table_name" = 'movie'
    `);
    const movieColumnNames = new Set(
      movieColumns.map((row) => row.column_name),
    );

    expect(movieColumnNames.has('rating')).toBe(false);
    expect(movieColumnNames.has('watchedAt')).toBe(false);
    expect(movieColumnNames.has('comment')).toBe(false);
    expect(movieColumnNames.has('directorId')).toBe(false);

    const userMovieColumns = await dataSource.query<
      Array<{ column_name: string }>
    >(`
      SELECT "column_name"
      FROM "information_schema"."columns"
      WHERE "table_schema" = 'public' AND "table_name" = 'user_movies'
    `);
    const userMovieColumnNames = new Set(
      userMovieColumns.map((row) => row.column_name),
    );

    expect(userMovieColumnNames.has('userId')).toBe(true);
    expect(userMovieColumnNames.has('movieId')).toBe(true);
    expect(userMovieColumnNames.has('rating')).toBe(true);
    expect(userMovieColumnNames.has('watchedAt')).toBe(true);
    expect(userMovieColumnNames.has('comment')).toBe(true);

    const movieDirectorColumns = await dataSource.query<
      Array<{ column_name: string }>
    >(`
      SELECT "column_name"
      FROM "information_schema"."columns"
      WHERE "table_schema" = 'public' AND "table_name" = 'movie_directors'
    `);
    const movieDirectorColumnNames = new Set(
      movieDirectorColumns.map((row) => row.column_name),
    );

    expect(movieDirectorColumnNames.has('movieId')).toBe(true);
    expect(movieDirectorColumnNames.has('directorId')).toBe(true);

    await request(app.getHttpServer())
      .post('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Movie A',
        rating: 77,
        watchedAt: '2026-03-01T10:00:00.000Z',
        comment: 'split model works',
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/user-movies')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual([
          expect.objectContaining({
            userId: USER_MOVIE_IDS.user,
            movie: expect.objectContaining({ id: USER_MOVIE_IDS.movieA }),
            rating: 77,
            comment: 'split model works',
          }),
        ]);
      });
  });
});
