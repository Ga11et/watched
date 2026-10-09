import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791504000000 implements MigrationInterface {
  name = 'InitialSchema1791504000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE "author" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "fullName" varchar NOT NULL,
        "photo" text,
        "comment" text,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE "book" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "genre" text,
        "pageCount" integer,
        "comment" text,
        "publishYear" integer,
        "cover" text,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE "director" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "fullName" varchar NOT NULL,
        "photo" text,
        "comment" text,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE "movie" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "genre" text,
        "releaseYear" integer,
        "poster" text,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE "series" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "genres" text,
        "country" text,
        "rating" numeric(5, 2),
        "comment" text,
        "totalSeasons" integer,
        "watchedSeasons" integer,
        "watchedAt" timestamp,
        "poster" text,
        "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE "developer" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "fullName" varchar NOT NULL,
        "photo" text,
        "comment" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE "publisher" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "fullName" varchar NOT NULL,
        "photo" text,
        "comment" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE "game" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "completionDate" date,
        "playTimeHours" real,
        "comment" text,
        "rating" integer,
        "cover" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE "user" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "username" text UNIQUE,
        "email" text UNIQUE,
        "passwordHash" text NOT NULL,
        "name" text NOT NULL,
        "role" varchar NOT NULL DEFAULT 'USER',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE "user_books" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "bookId" uuid NOT NULL REFERENCES "book"("id") ON DELETE CASCADE,
        "rating" integer,
        "readAt" timestamp,
        "comment" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE "user_movies" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "movieId" uuid NOT NULL REFERENCES "movie"("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
        "rating" integer,
        "watchedAt" timestamp,
        "comment" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_movies_user_movie" UNIQUE ("userId", "movieId")
      );
      CREATE TABLE "user_series" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "seriesId" uuid NOT NULL,
        "rating" integer,
        "watchedAt" bigint,
        "seasonsWatched" integer,
        "comment" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE "user_games" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "gameId" uuid NOT NULL,
        "rating" integer,
        "playedHours" real,
        "playedAt" bigint,
        "comment" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE "book_authors" (
        "bookId" uuid NOT NULL REFERENCES "book"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "authorId" uuid NOT NULL REFERENCES "author"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        PRIMARY KEY ("bookId", "authorId")
      );
      CREATE INDEX "IDX_book_authors_book" ON "book_authors" ("bookId");
      CREATE INDEX "IDX_book_authors_author" ON "book_authors" ("authorId");
      CREATE TABLE "movie_directors" (
        "movieId" uuid NOT NULL REFERENCES "movie"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "directorId" uuid NOT NULL REFERENCES "director"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        PRIMARY KEY ("movieId", "directorId")
      );
      CREATE INDEX "IDX_movie_directors_movie" ON "movie_directors" ("movieId");
      CREATE INDEX "IDX_movie_directors_director" ON "movie_directors" ("directorId");
      CREATE TABLE "game_publishers" (
        "gameId" uuid NOT NULL REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "publisherId" uuid NOT NULL REFERENCES "publisher"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        PRIMARY KEY ("gameId", "publisherId")
      );
      CREATE INDEX "IDX_game_publishers_game" ON "game_publishers" ("gameId");
      CREATE INDEX "IDX_game_publishers_publisher" ON "game_publishers" ("publisherId");
      CREATE TABLE "game_developers" (
        "gameId" uuid NOT NULL REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "developerId" uuid NOT NULL REFERENCES "developer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        PRIMARY KEY ("gameId", "developerId")
      );
      CREATE INDEX "IDX_game_developers_game" ON "game_developers" ("gameId");
      CREATE INDEX "IDX_game_developers_developer" ON "game_developers" ("developerId");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "game_developers", "game_publishers", "movie_directors", "book_authors",
        "user_games", "user_series", "user_movies", "user_books",
        "user", "game", "publisher", "developer", "series", "movie", "director", "book", "author";
    `);
  }
}
