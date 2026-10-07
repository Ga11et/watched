/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
 * E2E тесты модуля books.
 * Запуск:
 *   1. Поднять test-db: docker compose up -d test-db (порт 5434, БД watched_test)
 *   2. DB_NAME_TEST=watched_test DB_PORT=5434 npm run test:e2e -- test/books.e2e-spec.ts
 *   3. Или загрузить .env.test и запустить тесты
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
import { Book } from '../../src/books/entities/book.entity';
import { Author } from '../../src/authors/entities/author.entity';
import { UserBook } from '../../src/user-lists/entities/user-book.entity';
import { UserListsModule } from '../../src/user-lists/user-lists.module';
import { JwtService } from '../../src/auth/jwt.service';
import { AuthMiddleware } from '../../src/auth/auth.middleware';
import { AdminMiddleware } from '../../src/auth/admin.middleware';
import { AuthModule } from '../../src/auth/auth.module';
import { UsersModule } from '../../src/users/users.module';
import { BooksModule } from '../../src/books/books.module';
import { DirectorsModule } from '../../src/directors/directors.module';
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
    BooksModule,
    UserListsModule,
  ],
  providers: [AuthMiddleware, AdminMiddleware],
})
class BooksE2ETestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'books', method: RequestMethod.GET },
        { path: 'books/(.*)', method: RequestMethod.GET },
      );
    consumer
      .apply(AuthMiddleware, AdminMiddleware)
      .forRoutes(
        { path: 'books', method: RequestMethod.POST },
        { path: 'books/:id', method: RequestMethod.PUT },
        { path: 'books/:id', method: RequestMethod.DELETE },
      );
  }
}

describe('Books Module E2E Tests', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let booksRepository: Repository<Book>;
  let authorsRepository: Repository<Author>;
  let jwtService: JwtService;

  let adminUser: User;
  let plainUser: User;
  let guestUser: User;
  let adminToken: string;
  let userToken: string;
  let guestToken: string;
  let testAuthor: Author;
  let testBook: Book;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-books-e2e';
    jest.setTimeout(15000);

    if (e2eDbConfig.database !== TEST_DB_NAME) {
      throw new Error(
        `E2E tests must run against test DB "${TEST_DB_NAME}". ` +
          `Current database is "${e2eDbConfig.database}". ` +
          `Set DB_NAME_TEST=${TEST_DB_NAME} or do not set DB_NAME/DB_NAME_TEST.`,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BooksE2ETestModule],
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
        `Connected to database "${actualDb}" instead of test DB "${TEST_DB_NAME}". Aborting to avoid touching non-test data.`,
      );
    }

    usersRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    booksRepository = moduleFixture.get<Repository<Book>>(
      getRepositoryToken(Book),
    );
    authorsRepository = moduleFixture.get<Repository<Author>>(
      getRepositoryToken(Author),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    adminUser = usersRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440001',
      username: 'admin',
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: '$2b$10$hash',
      role: UserRole.ADMIN,
      isActive: true,
    });

    plainUser = usersRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440002',
      username: 'user',
      email: 'user@example.com',
      name: 'Plain User',
      passwordHash: '$2b$10$hash',
      role: UserRole.USER,
      isActive: true,
    });

    guestUser = usersRepository.create({
      id: '550e8400-e29b-41d4-a716-446655440003',
      username: 'guest',
      email: 'guest@example.com',
      name: 'Guest User',
      passwordHash: '$2b$10$hash',
      role: UserRole.GUEST,
      isActive: true,
    });

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

    testBook = booksRepository.create({
      id: '770e8400-e29b-41d4-a716-446655440001',
      title: 'Война и мир',
      genre: 'Роман',
      authors: [testAuthor],
      pageCount: 1225,
      comment: 'Великая книга',
      publishYear: 1869,
      cover: null,
    });
    await booksRepository.save(testBook);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Доступ по ролям: GET-эндпоинты (только для авторизованных, в т.ч. GUEST)', () => {
    it('GET /books без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/books').expect(401);
    });

    it('GET /books/stats без токена возвращает 401', () => {
      return request(app.getHttpServer()).get('/books/stats').expect(401);
    });

    it('GET /books/:id без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .get(`/books/${testBook.id}`)
        .expect(401);
    });

    it('GET /books с токеном GUEST возвращает 200 и массив', () => {
      return request(app.getHttpServer())
        .get('/books')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /books/stats с токеном GUEST возвращает 200 и структуру статистики', () => {
      return request(app.getHttpServer())
        .get('/books/stats')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('thisMonth');
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.thisMonth).toBe('number');
        });
    });

    it('GET /books/:id с токеном GUEST возвращает 200 для существующей книги', () => {
      return request(app.getHttpServer())
        .get(`/books/${testBook.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testBook.id);
          expect(res.body.title).toBe(testBook.title);
        });
    });

    it('GET /books с токеном USER возвращает 200', () => {
      return request(app.getHttpServer())
        .get('/books')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('GET /books с токеном ADMIN возвращает 200', () => {
      return request(app.getHttpServer())
        .get('/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Доступ по ролям: POST /books', () => {
    it('POST /books без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .post('/books')
        .send({ title: 'Новая книга' })
        .expect(401);
    });

    it('POST /books с ролью USER возвращает 403', () => {
      return request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Книга от пользователя' })
        .expect(403);
    });

    it('POST /books с ролью GUEST возвращает 403', () => {
      return request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ title: 'Книга от гостя' })
        .expect(403);
    });

    it('POST /books с ролью ADMIN возвращает 201 и создаёт книгу', () => {
      return request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Книга от админа',
          genre: 'Фантастика',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.title).toBe('Книга от админа');
          expect(res.body.genre).toBe('Фантастика');
        });
    });
  });

  describe('Доступ по ролям: PUT /books/:id', () => {
    it('PUT /books/:id без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .put(`/books/${testBook.id}`)
        .send({ title: 'Обновлённое название' })
        .expect(401);
    });

    it('PUT /books/:id с ролью USER возвращает 403', () => {
      return request(app.getHttpServer())
        .put(`/books/${testBook.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Попытка редактирования' })
        .expect(403);
    });

    it('PUT /books/:id с ролью GUEST возвращает 403', () => {
      return request(app.getHttpServer())
        .put(`/books/${testBook.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .send({ title: 'Попытка редактирования' })
        .expect(403);
    });

    it('PUT /books/:id с ролью ADMIN возвращает 200 и обновляет книгу', async () => {
      await request(app.getHttpServer())
        .put(`/books/${testBook.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Война и мир (обновлено)',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Война и мир (обновлено)');
          expect(res.body.comment).toBe('Великая книга');
        });
      // восстанавливаем для других тестов
      await booksRepository.update(testBook.id, {
        title: testBook.title,
        comment: testBook.comment,
      });
    });
  });

  describe('Доступ по ролям: DELETE /books/:id', () => {
    let bookToDelete: Book;

    beforeAll(async () => {
      bookToDelete = booksRepository.create({
        title: 'Книга на удаление',
        genre: 'Драма',
      });
      await booksRepository.save(bookToDelete);
    });

    it('DELETE /books/:id без токена возвращает 401', () => {
      return request(app.getHttpServer())
        .delete(`/books/${bookToDelete.id}`)
        .expect(401);
    });

    it('DELETE /books/:id с ролью USER возвращает 403', () => {
      return request(app.getHttpServer())
        .delete(`/books/${bookToDelete.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('DELETE /books/:id с ролью GUEST возвращает 403', () => {
      return request(app.getHttpServer())
        .delete(`/books/${bookToDelete.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(403);
    });

    it('DELETE /books/:id с ролью ADMIN возвращает 200 и удаляет книгу', async () => {
      await request(app.getHttpServer())
        .delete(`/books/${bookToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const found = await booksRepository.findOne({
        where: { id: bookToDelete.id },
      });
      expect(found).toBeNull();
    });
  });

  describe('Крайние сценарии: создание книги', () => {
    it('POST /books с пустым title возвращает 422 и violations', () => {
      return request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '   ' })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
          expect(res.body.violations).toBeDefined();
          const titleViolation = (
            res.body.violations as Array<{ field: string }>
          ).find((v: { field: string }) => v.field === 'title');
          expect(titleViolation).toBeDefined();
        });
    });

    it('POST /books с валидным authorIds привязывает автора', () => {
      return request(app.getHttpServer())
        .post('/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Анна Каренина',
          authorIds: [testAuthor.id],
          genre: 'Роман',
        })
        .expect(201)
        .expect((res) => {
          expect(Array.isArray(res.body.authors)).toBe(true);
          expect(res.body.authors[0]?.id).toBe(testAuthor.id);
          expect(res.body.title).toBe('Анна Каренина');
        });
    });
  });

  describe('Крайние сценарии: получение книги', () => {
    it('GET /books/:id с несуществующим UUID возвращает 404', () => {
      return request(app.getHttpServer())
        .get('/books/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(404);
    });

    it('GET /books/:id с некорректным UUID возвращает 404 (невалидный формат)', async () => {
      const res = await request(app.getHttpServer())
        .get('/books/not-a-uuid')
        .set('Authorization', `Bearer ${guestToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Крайние сценарии: обновление книги', () => {
    it('PUT /books/:id с пустым title возвращает 422', () => {
      return request(app.getHttpServer())
        .put(`/books/${testBook.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '   ' })
        .expect(422)
        .expect((res) => {
          expect(res.body.violations).toBeDefined();
        });
    });

    it('PUT /books/:id с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .put('/books/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Название' })
        .expect(404);
    });
  });

  describe('Крайние сценарии: удаление книги', () => {
    it('DELETE /books/:id с несуществующим id возвращает 404', () => {
      return request(app.getHttpServer())
        .delete('/books/550e8400-e29b-41d4-a716-446655440099')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('DELETE /books/:id каскадно удаляет все связанные user-books', async () => {
      const dataSource = app.get(DataSource);
      const userBooksRepository = dataSource.getRepository(UserBook);

      const book = await booksRepository.save(
        booksRepository.create({ title: 'Book to cascade delete' }),
      );

      const [ub1, ub2] = await userBooksRepository.save([
        userBooksRepository.create({
          userId: adminUser.id,
          bookId: book.id,
          rating: 80,
        }),
        userBooksRepository.create({
          userId: plainUser.id,
          bookId: book.id,
          rating: 60,
          comment: 'will be deleted',
        }),
      ]);

      await request(app.getHttpServer())
        .delete(`/books/${book.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const deletedBook = await booksRepository.findOne({
        where: { id: book.id },
      });
      expect(deletedBook).toBeNull();

      const remainingUserBooks = await userBooksRepository.find({
        where: [{ id: ub1.id }, { id: ub2.id }],
      });
      expect(remainingUserBooks).toHaveLength(0);
    });
  });

  describe('Крайние сценарии: список и фильтры', () => {
    beforeAll(async () => {
      await booksRepository.save([
        booksRepository.create({
          title: 'Search Token Alpha',
          genre: 'Test',
        }),
        booksRepository.create({
          title: 'search token beta',
          genre: 'Test',
        }),
        booksRepository.create({
          title: 'Gamma Search Token',
          genre: 'Test',
        }),
        booksRepository.create({
          title: 'Search Token Delta',
          genre: 'Test',
        }),
        booksRepository.create({
          title: 'Search Token Epsilon',
          genre: 'Test',
        }),
        booksRepository.create({
          title: 'Search Token Zeta',
          genre: 'Test',
        }),
      ]);
    });

    it('GET /books?search=<full-title> возвращает совпадение по точному названию', () => {
      return request(app.getHttpServer())
        .get('/books?search=Search%20Token%20Alpha')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(
            res.body.some(
              (book: { title: string }) => book.title === 'Search Token Alpha',
            ),
          ).toBe(true);
        });
    });

    it('GET /books?search=<partial-fragment> поддерживает частичный поиск', () => {
      return request(app.getHttpServer())
        .get('/books?search=Token')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          res.body.forEach((book: { title: string }) => {
            expect(book.title.toLowerCase()).toContain('token');
          });
        });
    });

    it('GET /books?search=<upper-or-mixed-case> выполняет регистронезависимый поиск', () => {
      return request(app.getHttpServer())
        .get('/books?search=SeArCh%20ToKeN')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          res.body.forEach((book: { title: string }) => {
            expect(book.title.toLowerCase()).toContain('search token');
          });
        });
    });

    it('GET /books?search=<query>&limit=5 возвращает не более 5 результатов и только по запросу', () => {
      return request(app.getHttpServer())
        .get('/books?search=Search%20Token&limit=5')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(5);
          res.body.forEach((book: { title: string }) => {
            expect(book.title.toLowerCase()).toContain('search token');
          });
        });
    });

    it('GET /books?search=<no-match> возвращает пустой массив', () => {
      return request(app.getHttpServer())
        .get('/books?search=NoSuchBookTitle123')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(0);
        });
    });

    it('GET /books?sortBy=title&sortOrder=ASC возвращает 200 и сортировку', () => {
      return request(app.getHttpServer())
        .get('/books?sortBy=title&sortOrder=ASC')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length >= 2) {
            expect(
              res.body[0].title.localeCompare(res.body[1].title),
            ).toBeLessThanOrEqual(0);
          }
        });
    });

    it('GET /books?sortBy=rating&sortOrder=DESC возвращает 200', () => {
      return request(app.getHttpServer())
        .get('/books?sortBy=rating&sortOrder=DESC')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200);
    });

    it('GET /books?authorId=... возвращает только книги автора', () => {
      return request(app.getHttpServer())
        .get(`/books?authorId=${testAuthor.id}`)
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((book: { authors?: Array<{ id: string }> }) => {
            expect(Array.isArray(book.authors)).toBe(true);
            expect(
              book.authors?.some((author) => author.id === testAuthor.id),
            ).toBe(true);
          });
        });
    });

    it('GET /books?limit=1 возвращает не более 1 книги', () => {
      return request(app.getHttpServer())
        .get('/books?limit=1')
        .set('Authorization', `Bearer ${guestToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(1);
        });
    });

    it('GET /books/stats возвращает корректную структуру', async () => {
      const res = await request(app.getHttpServer())
        .get('/books/stats')
        .set('Authorization', `Bearer ${guestToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        total: expect.any(Number),
        thisMonth: expect.any(Number),
      });
    });
  });

  describe('Невалидный и просроченный токен на защищённых эндпоинтах', () => {
    it('POST /books с невалидным токеном возвращает 403', () => {
      return request(app.getHttpServer())
        .post('/books')
        .set('Authorization', 'Bearer invalid-token')
        .send({ title: 'Книга' })
        .expect(403);
    });

    it('PUT /books/:id с невалидным токеном возвращает 403', () => {
      return request(app.getHttpServer())
        .put(`/books/${testBook.id}`)
        .set('Authorization', 'Bearer invalid-token')
        .send({ title: 'Название' })
        .expect(403);
    });

    it('DELETE /books/:id с невалидным токеном возвращает 403', () => {
      return request(app.getHttpServer())
        .delete(`/books/${testBook.id}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);
    });
  });
});
