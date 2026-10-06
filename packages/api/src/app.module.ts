import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamesModule } from './games/games.module';
import { DirectorsModule } from './directors/directors.module';
import { MoviesModule } from './movies/movies.module';
import { SeriesModule } from './series/series.module';
import { BooksModule } from './books/books.module';
import { AuthorsModule } from './authors/authors.module';
import { PublishersModule } from './publishers/publishers.module';
import { DevelopersModule } from './developers/developers.module';
import { UserListsModule } from './user-lists/user-lists.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuthMiddleware } from './auth/auth.middleware';
import { AdminMiddleware } from './auth/admin.middleware';
import { ApiExceptionFilter } from './auth/api-exception.filter';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: +(process.env.DB_PORT || 5433),
      username: process.env.DB_USER || 'watched',
      password: process.env.DB_PASSWORD || 'watched',
      database: process.env.DB_NAME || 'watched',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // In development only
    }),
    GamesModule,
    DirectorsModule,
    MoviesModule,
    SeriesModule,
    BooksModule,
    AuthorsModule,
    PublishersModule,
    DevelopersModule,
    AuthModule,
    UsersModule,
    UserListsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AuthMiddleware,
    AdminMiddleware,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'auth/me', method: RequestMethod.GET },
        { path: 'users', method: RequestMethod.ALL },
        { path: 'users/(.*)', method: RequestMethod.ALL },
        { path: 'books', method: RequestMethod.GET },
        { path: 'books/(.*)', method: RequestMethod.GET },
        { path: 'movies', method: RequestMethod.GET },
        { path: 'movies/(.*)', method: RequestMethod.GET },
        { path: 'series', method: RequestMethod.GET },
        { path: 'series/(.*)', method: RequestMethod.GET },
        { path: 'games', method: RequestMethod.GET },
        { path: 'games/(.*)', method: RequestMethod.GET },
        { path: 'authors', method: RequestMethod.GET },
        { path: 'authors/(.*)', method: RequestMethod.GET },
        { path: 'directors', method: RequestMethod.GET },
        { path: 'directors/(.*)', method: RequestMethod.GET },
        { path: 'publishers', method: RequestMethod.GET },
        { path: 'publishers/(.*)', method: RequestMethod.GET },
        { path: 'developers', method: RequestMethod.GET },
        { path: 'developers/(.*)', method: RequestMethod.GET },
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
        { path: 'publishers', method: RequestMethod.POST },
        { path: 'publishers/:id', method: RequestMethod.PUT },
        { path: 'publishers/:id', method: RequestMethod.DELETE },
        { path: 'developers', method: RequestMethod.POST },
        { path: 'developers/:id', method: RequestMethod.PUT },
        { path: 'developers/:id', method: RequestMethod.DELETE },
      );
  }
}
