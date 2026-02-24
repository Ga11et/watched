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

describe('DevelopersController (e2e)', () => {
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

  it('POST /developers creates developer', async () => {
    const response = await request(app.getHttpServer())
      .post('/developers')
      .send({ fullName: 'Larian Studios' })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.fullName).toBe('Larian Studios');
  });

  it('POST /developers returns 422 for empty fullName', async () => {
    await request(app.getHttpServer())
      .post('/developers')
      .send({ fullName: '   ' })
      .expect(422);
  });

  it('GET /developers supports sort and limit', async () => {
    await request(app.getHttpServer())
      .post('/developers')
      .send({ fullName: 'AAA Developer' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/developers')
      .query({ sortBy: 'fullName', sortOrder: 'ASC', limit: '1' })
      .expect(200);

    expect(response.body).toHaveLength(1);
  });

  it('GET /developers/stats returns total', async () => {
    const response = await request(app.getHttpServer())
      .get('/developers/stats')
      .expect(200);

    expect(response.body.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /developers/search returns matched results', async () => {
    const response = await request(app.getHttpServer())
      .get('/developers/search')
      .query({ q: 'Larian' })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /developers/:id returns 404 for unknown id', async () => {
    await request(app.getHttpServer())
      .get('/developers/550e8400-e29b-41d4-a716-446655440000')
      .expect(404);
  });

  it('GET /developers/:id returns linked games', async () => {
    const publisher = await request(app.getHttpServer())
      .post('/publishers')
      .send({ fullName: 'Linked Publisher' })
      .expect(201);

    const developer = await request(app.getHttpServer())
      .post('/developers')
      .send({ fullName: 'Linked Developer' })
      .expect(201);

    const game = await request(app.getHttpServer())
      .post('/games')
      .send({
        title: 'Linked Game',
        publisherIds: [publisher.body.id],
        developerIds: [developer.body.id],
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/developers/${developer.body.id}`)
      .expect(200);

    expect(Array.isArray(response.body.games)).toBe(true);
    expect(response.body.games).toHaveLength(1);
    expect(response.body.games[0].id).toBe(game.body.id);
    expect(response.body.games[0].title).toBe('Linked Game');
  });

  it('PUT /developers/:id updates developer', async () => {
    const created = await request(app.getHttpServer())
      .post('/developers')
      .send({ fullName: 'Update Studio' })
      .expect(201);

    const updated = await request(app.getHttpServer())
      .put(`/developers/${created.body.id}`)
      .send({ fullName: 'Updated Studio', comment: 'Updated comment' })
      .expect(200);

    expect(updated.body.fullName).toBe('Updated Studio');
    expect(updated.body.comment).toBe('Updated comment');
  });

  it('DELETE /developers/:id removes relation from games', async () => {
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
      .delete(`/developers/${developer.body.id}`)
      .expect(200);

    const gameAfterDelete = await request(app.getHttpServer())
      .get(`/games/${game.body.id}`)
      .expect(200);

    expect(gameAfterDelete.body.developers).toHaveLength(0);
    expect(gameAfterDelete.body.publishers).toHaveLength(1);
  });
});
