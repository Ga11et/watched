/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { PublishersModule } from '../src/publishers/publishers.module';
import { DevelopersModule } from '../src/developers/developers.module';
import { GamesModule } from '../src/games/games.module';
import { Publisher } from '../src/publishers/entities/publisher.entity';
import { Developer } from '../src/developers/entities/developer.entity';
import { Game } from '../src/games/entities/game.entity';

describe('PublishersController (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Publisher, Developer, Game],
          synchronize: true,
          dropSchema: true,
        }),
        PublishersModule,
        DevelopersModule,
        GamesModule,
      ],
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
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  it('POST /publishers creates publisher', async () => {
    const response = await request(app.getHttpServer())
      .post('/publishers')
      .send({ fullName: 'CD Projekt' })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.fullName).toBe('CD Projekt');
  });

  it('POST /publishers returns 422 for empty fullName', async () => {
    await request(app.getHttpServer())
      .post('/publishers')
      .send({ fullName: '   ' })
      .expect(422);
  });

  it('GET /publishers supports sort and limit', async () => {
    await request(app.getHttpServer())
      .post('/publishers')
      .send({ fullName: 'AAA Publisher' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/publishers')
      .query({ sortBy: 'fullName', sortOrder: 'ASC', limit: '1' })
      .expect(200);

    expect(response.body).toHaveLength(1);
  });

  it('GET /publishers/stats returns total', async () => {
    const response = await request(app.getHttpServer())
      .get('/publishers/stats')
      .expect(200);

    expect(response.body.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /publishers/search returns matched results', async () => {
    const response = await request(app.getHttpServer())
      .get('/publishers/search')
      .query({ q: 'Projekt' })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /publishers/:id returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get('/publishers/550e8400-e29b-41d4-a716-446655440000')
      .expect(404);
  });

  it('PUT /publishers/:id updates publisher', async () => {
    const created = await request(app.getHttpServer())
      .post('/publishers')
      .send({ fullName: 'Update Me' })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .put(`/publishers/${created.body.id}`)
      .send({ fullName: 'Updated Publisher', comment: 'Updated comment' })
      .expect(200);

    expect(updated.body.fullName).toBe('Updated Publisher');
    expect(updated.body.comment).toBe('Updated comment');
  });

  it('DELETE /publishers/:id removes relation from games', async () => {
    const publisher = await request(app.getHttpServer())
      .post('/publishers')
      .send({ fullName: 'Relational Publisher' })
      .expect(201);

    const developer = await request(app.getHttpServer())
      .post('/developers')
      .send({ fullName: 'Relational Developer' })
      .expect(201);

    const game = await request(app.getHttpServer())
      .post('/games')
      .send({
        title: 'Relational Game',
        publisherIds: [publisher.body.id],
        developerIds: [developer.body.id],
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/publishers/${publisher.body.id}`)
      .expect(200);

    const gameAfterDelete = await request(app.getHttpServer())
      .get(`/games/${game.body.id}`)
      .expect(200);

    expect(gameAfterDelete.body.publishers).toHaveLength(0);
    expect(gameAfterDelete.body.developers).toHaveLength(1);
  });
});
