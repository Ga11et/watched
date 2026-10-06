/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Delete,
  INestApplication,
  MiddlewareConsumer,
  Module,
  NestModule,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  RequestMethod,
  ValidationPipe,
  Get,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import jwt, { SignOptions } from 'jsonwebtoken';
import { App } from 'supertest/types';
import { UserRole } from '../src/users/entities/user.entity';
import { JwtPayload, JwtService } from '../src/auth/jwt.service';
import { AuthMiddleware } from '../src/auth/auth.middleware';
import { AdminMiddleware } from '../src/auth/admin.middleware';

const NOT_FOUND_ID = '550e8400-e29b-41d4-a716-446655440000';

@Controller()
class CatalogStubController {
  @Get('books')
  getBooks(): [] {
    return [];
  }

  @Get('books/:id')
  getBook(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Book not found');
    }

    return { id };
  }

  @Post('books')
  createBook(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('books/:id')
  updateBook(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Delete('books/:id')
  removeBook(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Get('movies')
  getMovies(): [] {
    return [];
  }

  @Get('movies/:id')
  getMovie(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Movie not found');
    }

    return { id };
  }

  @Post('movies')
  createMovie(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('movies/:id')
  updateMovie(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Delete('movies/:id')
  removeMovie(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Get('series')
  getSeries(): [] {
    return [];
  }

  @Get('series/:id')
  getSeriesById(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Series not found');
    }

    return { id };
  }

  @Post('series')
  createSeries(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('series/:id')
  updateSeries(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Delete('series/:id')
  removeSeries(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Get('games')
  getGames(): [] {
    return [];
  }

  @Get('games/:id')
  getGame(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Game not found');
    }

    return { id };
  }

  @Post('games')
  createGame(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('games/:id')
  updateGame(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Delete('games/:id')
  removeGame(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Get('authors')
  getAuthors(): [] {
    return [];
  }

  @Get('authors/:id')
  getAuthor(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Author not found');
    }

    return { id };
  }

  @Post('authors')
  createAuthor(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('authors/:id')
  updateAuthor(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Delete('authors/:id')
  removeAuthor(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Get('directors')
  getDirectors(): [] {
    return [];
  }

  @Get('directors/:id')
  getDirector(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    if (id === NOT_FOUND_ID) {
      throw new NotFoundException('Director not found');
    }

    return { id };
  }

  @Post('directors')
  createDirector(): { id: string } {
    return { id: VALID_ITEM_ID };
  }

  @Put('directors/:id')
  updateDirector(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Delete('directors/:id')
  removeDirector(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }
}

@Controller()
class UserListsStubController {
  @Get('user-books')
  getCurrentUserBooks(): [] {
    return [];
  }

  @Post('user-books')
  createCurrentUserBook(): { created: boolean } {
    return { created: true };
  }

  @Put('user-books/:id')
  updateCurrentUserBook(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-books/:id')
  removeCurrentUserBook(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-movies')
  getCurrentUserMovies(): [] {
    return [];
  }

  @Get('user-movies/stats')
  getCurrentUserMovieStats(): { total: number; thisMonth: number; avgRating: null } {
    return { total: 0, thisMonth: 0, avgRating: null };
  }

  @Get('user-movies/:id')
  getCurrentUserMovieById(@Param('id', ParseUUIDPipe) id: string): { id: string } {
    return { id };
  }

  @Post('user-movies')
  createCurrentUserMovie(): { created: boolean } {
    return { created: true };
  }

  @Put('user-movies/:id')
  updateCurrentUserMovie(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-movies/:id')
  removeCurrentUserMovie(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-series')
  getCurrentUserSeries(): [] {
    return [];
  }

  @Post('user-series')
  createCurrentUserSeries(): { created: boolean } {
    return { created: true };
  }

  @Put('user-series/:id')
  updateCurrentUserSeries(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-series/:id')
  removeCurrentUserSeries(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-games')
  getCurrentUserGames(): [] {
    return [];
  }

  @Post('user-games')
  createCurrentUserGame(): { created: boolean } {
    return { created: true };
  }

  @Put('user-games/:id')
  updateCurrentUserGame(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-games/:id')
  removeCurrentUserGame(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-authors')
  getCurrentUserAuthors(): [] {
    return [];
  }

  @Post('user-authors')
  createCurrentUserAuthor(): { created: boolean } {
    return { created: true };
  }

  @Put('user-authors/:id')
  updateCurrentUserAuthor(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-authors/:id')
  removeCurrentUserAuthor(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-directors')
  getCurrentUserDirectors(): [] {
    return [];
  }

  @Post('user-directors')
  createCurrentUserDirector(): { created: boolean } {
    return { created: true };
  }

  @Put('user-directors/:id')
  updateCurrentUserDirector(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-directors/:id')
  removeCurrentUserDirector(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user/:guid/books')
  getUserBooksByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/movies')
  getUserMoviesByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/series')
  getUserSeriesByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/games')
  getUserGamesByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/authors')
  getUserAuthorsByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/directors')
  getUserDirectorsByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }
}

@Module({
  controllers: [CatalogStubController, UserListsStubController],
  providers: [JwtService, AuthMiddleware, AdminMiddleware],
})
class AuthProtectionTestModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'user-books', method: RequestMethod.ALL },
        { path: 'user-books/(.*)', method: RequestMethod.ALL },
        { path: 'user-movies', method: RequestMethod.GET },
        { path: 'user-movies/stats', method: RequestMethod.GET },
        { path: 'user-movies', method: RequestMethod.POST },
        { path: 'user-movies/:id', method: RequestMethod.PUT },
        { path: 'user-movies/:id', method: RequestMethod.DELETE },
        { path: 'user-series', method: RequestMethod.ALL },
        { path: 'user-series/(.*)', method: RequestMethod.ALL },
        { path: 'user-games', method: RequestMethod.ALL },
        { path: 'user-games/(.*)', method: RequestMethod.ALL },
        { path: 'user-authors', method: RequestMethod.ALL },
        { path: 'user-authors/(.*)', method: RequestMethod.ALL },
        { path: 'user-directors', method: RequestMethod.ALL },
        { path: 'user-directors/(.*)', method: RequestMethod.ALL },
      );

    consumer
      .apply(AuthMiddleware, AdminMiddleware)
      .forRoutes(
        { path: 'books', method: RequestMethod.POST },
        { path: 'books/:id', method: RequestMethod.PUT },
        { path: 'books/:id', method: RequestMethod.DELETE },
        { path: 'movies', method: RequestMethod.POST },
        { path: 'movies/:id', method: RequestMethod.PUT },
        { path: 'movies/:id', method: RequestMethod.DELETE },
        { path: 'series', method: RequestMethod.POST },
        { path: 'series/:id', method: RequestMethod.PUT },
        { path: 'series/:id', method: RequestMethod.DELETE },
        { path: 'games', method: RequestMethod.POST },
        { path: 'games/:id', method: RequestMethod.PUT },
        { path: 'games/:id', method: RequestMethod.DELETE },
        { path: 'authors', method: RequestMethod.POST },
        { path: 'authors/:id', method: RequestMethod.PUT },
        { path: 'authors/:id', method: RequestMethod.DELETE },
        { path: 'directors', method: RequestMethod.POST },
        { path: 'directors/:id', method: RequestMethod.PUT },
        { path: 'directors/:id', method: RequestMethod.DELETE },
      );
  }
}

type HttpMethod = 'get' | 'post' | 'put' | 'delete';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const ADMIN_ID = '22222222-2222-4222-8222-222222222222';
const VALID_ITEM_ID = '33333333-3333-4333-8333-333333333333';
const PUBLIC_GUID = '44444444-4444-4444-8444-444444444444';

describe('Step 4 auth protection (e2e)', () => {
  let app: INestApplication<App>;
  let originalJwtSecret: string | undefined;

  const protectedUserRoutes: Array<{
    method: HttpMethod;
    path: string;
    expectedStatus: number;
    body?: Record<string, unknown>;
  }> = [
    { method: 'get', path: '/user-books', expectedStatus: 200 },
    { method: 'post', path: '/user-books', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-books/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-books/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },

    { method: 'get', path: '/user-movies', expectedStatus: 200 },
    { method: 'get', path: '/user-movies/stats', expectedStatus: 200 },
    { method: 'post', path: '/user-movies', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-movies/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-movies/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },

    { method: 'get', path: '/user-series', expectedStatus: 200 },
    { method: 'post', path: '/user-series', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-series/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-series/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },

    { method: 'get', path: '/user-games', expectedStatus: 200 },
    { method: 'post', path: '/user-games', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-games/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-games/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },

    { method: 'get', path: '/user-authors', expectedStatus: 200 },
    { method: 'post', path: '/user-authors', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-authors/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-authors/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },

    { method: 'get', path: '/user-directors', expectedStatus: 200 },
    { method: 'post', path: '/user-directors', expectedStatus: 201, body: {} },
    {
      method: 'put',
      path: `/user-directors/${VALID_ITEM_ID}`,
      expectedStatus: 200,
      body: {},
    },
    {
      method: 'delete',
      path: `/user-directors/${VALID_ITEM_ID}`,
      expectedStatus: 200,
    },
  ];

  const publicGuidRoutes = [
    `/user/${PUBLIC_GUID}/books`,
    `/user/${PUBLIC_GUID}/movies`,
    `/user/${PUBLIC_GUID}/series`,
    `/user/${PUBLIC_GUID}/games`,
    `/user/${PUBLIC_GUID}/authors`,
    `/user/${PUBLIC_GUID}/directors`,
  ];

  const openGetRoutes = [
    '/books',
    '/books/550e8400-e29b-41d4-a716-446655440000',
    '/movies',
    '/movies/550e8400-e29b-41d4-a716-446655440000',
    '/series',
    '/series/550e8400-e29b-41d4-a716-446655440000',
    '/games',
    '/games/550e8400-e29b-41d4-a716-446655440000',
    '/authors',
    '/authors/550e8400-e29b-41d4-a716-446655440000',
    '/directors',
    '/directors/550e8400-e29b-41d4-a716-446655440000',
    '/user-movies/550e8400-e29b-41d4-a716-446655440000',
  ];

  const adminEntities: Array<{
    route: string;
    createBody: Record<string, unknown>;
    updateBody: Record<string, unknown>;
  }> = [
    {
      route: 'books',
      createBody: { title: 'Admin Book' },
      updateBody: { title: 'Admin Book Updated' },
    },
    {
      route: 'movies',
      createBody: { title: 'Admin Movie' },
      updateBody: { title: 'Admin Movie Updated' },
    },
    {
      route: 'series',
      createBody: { title: 'Admin Series' },
      updateBody: { title: 'Admin Series Updated' },
    },
    {
      route: 'games',
      createBody: { title: 'Admin Game' },
      updateBody: { title: 'Admin Game Updated' },
    },
    {
      route: 'authors',
      createBody: { fullName: 'Admin Author' },
      updateBody: { fullName: 'Admin Author Updated' },
    },
    {
      route: 'directors',
      createBody: { fullName: 'Admin Director' },
      updateBody: { fullName: 'Admin Director Updated' },
    },
  ];

  const signToken = (
    role: UserRole,
    userId: string,
    options?: SignOptions,
  ): string => {
    const payload: JwtPayload = {
      userId,
      username: `${role.toLowerCase()}-user`,
      name: `${role} User`,
      role,
    };

    return jwt.sign(payload, process.env.JWT_SECRET as string, {
      algorithm: 'HS256',
      expiresIn: '24h',
      ...options,
    });
  };

  const send = (
    method: HttpMethod,
    path: string,
    token?: string,
    body?: Record<string, unknown>,
  ) => {
    const req = request(app.getHttpServer())[method](path);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    if (body) {
      req.send(body);
    }

    return req;
  };

  beforeAll(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'step4-test-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthProtectionTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    process.env.JWT_SECRET = originalJwtSecret;

    if (app) {
      await app.close();
    }
  });

  describe('JWT-protected user-* routes', () => {
    it.each(protectedUserRoutes)(
      '$method $path returns 401 without token',
      async ({ method, path, body }) => {
        await send(method, path, undefined, body).expect(401);
      },
    );

    it.each(protectedUserRoutes)(
      '$method $path returns 403 with invalid token',
      async ({ method, path, body }) => {
        await send(method, path, 'invalid-token', body).expect(403);
      },
    );

    it.each(protectedUserRoutes)(
      '$method $path returns 403 with expired token',
      async ({ method, path, body }) => {
        const expiredToken = signToken(UserRole.USER, USER_ID, {
          expiresIn: '-1h',
        });

        await send(method, path, expiredToken, body).expect(403);
      },
    );

    it.each(protectedUserRoutes)(
      '$method $path passes with valid JWT',
      async ({ method, path, body, expectedStatus }) => {
        const token = signToken(UserRole.USER, USER_ID);

        await send(method, path, token, body).expect(expectedStatus);
      },
    );

    it.each([
      '/user-books/not-a-uuid',
      '/user-movies/not-a-uuid',
      '/user-series/not-a-uuid',
      '/user-games/not-a-uuid',
      '/user-authors/not-a-uuid',
      '/user-directors/not-a-uuid',
    ])('PUT %s returns 400 for invalid id format', async (path) => {
      const token = signToken(UserRole.USER, USER_ID);
      await send('put', path, token, {}).expect(400);
    });
  });

  describe('Public user/:guid/* routes', () => {
    it.each(publicGuidRoutes)(
      '%s is accessible without token',
      async (path) => {
        await send('get', path).expect(200);
      },
    );

    it.each(publicGuidRoutes)(
      '%s is accessible with valid token',
      async (path) => {
        const token = signToken(UserRole.USER, USER_ID);
        await send('get', path, token).expect(200);
      },
    );

    it.each([
      '/user/not-a-guid/books',
      '/user/not-a-guid/movies',
      '/user/not-a-guid/series',
      '/user/not-a-guid/games',
      '/user/not-a-guid/authors',
      '/user/not-a-guid/directors',
    ])('%s returns 400 for invalid guid format', async (path) => {
      await send('get', path).expect(400);
    });
  });

  describe('Admin-only mutating /entity routes', () => {
    it.each(adminEntities)(
      'POST /$route returns 401 without token',
      async ({ route, createBody }) => {
        await send('post', `/${route}`, undefined, createBody).expect(401);
      },
    );

    it.each(adminEntities)(
      'POST /$route returns 403 for non-admin token',
      async ({ route, createBody }) => {
        const userToken = signToken(UserRole.USER, USER_ID);
        await send('post', `/${route}`, userToken, createBody).expect(403);
      },
    );

    it.each(adminEntities)(
      'POST /$route returns 403 for invalid or expired JWT',
      async ({ route, createBody }) => {
        await send('post', `/${route}`, 'invalid-token', createBody).expect(
          403,
        );

        const expiredToken = signToken(UserRole.ADMIN, ADMIN_ID, {
          expiresIn: '-1h',
        });
        await send('post', `/${route}`, expiredToken, createBody).expect(403);
      },
    );

    it.each(adminEntities)(
      'POST/PUT/DELETE /$route passes for ADMIN token',
      async ({ route, createBody, updateBody }) => {
        const adminToken = signToken(UserRole.ADMIN, ADMIN_ID);

        const created = await send(
          'post',
          `/${route}`,
          adminToken,
          createBody,
        ).expect(201);

        await send(
          'put',
          `/${route}/${created.body.id}`,
          adminToken,
          updateBody,
        ).expect(200);

        await send('delete', `/${route}/${created.body.id}`, adminToken).expect(
          200,
        );
      },
    );
  });

  describe('Open GET /entity routes', () => {
    it.each(openGetRoutes)('%s works without token', async (path) => {
      const response = await send('get', path).expect((res) => {
        expect([200, 404]).toContain(res.status);
      });

      expect([200, 404]).toContain(response.status);
    });

    it.each(openGetRoutes)(
      '%s is not blocked by invalid token',
      async (path) => {
        const response = await send('get', path, 'invalid-token').expect(
          (res) => {
            expect([200, 404]).toContain(res.status);
          },
        );

        expect([200, 404]).toContain(response.status);
      },
    );

    it.each(openGetRoutes)(
      '%s is not blocked by expired token',
      async (path) => {
        const expiredToken = signToken(UserRole.USER, USER_ID, {
          expiresIn: '-1h',
        });

        const response = await send('get', path, expiredToken).expect((res) => {
          expect([200, 404]).toContain(res.status);
        });

        expect([200, 404]).toContain(response.status);
      },
    );
  });
});
