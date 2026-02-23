/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { PublishersModule } from '../src/publishers/publishers.module';
import { DevelopersModule } from '../src/developers/developers.module';
import { GamesModule } from '../src/games/games.module';
import { Publisher } from '../src/publishers/entities/publisher.entity';
import { Developer } from '../src/developers/entities/developer.entity';
import { Game } from '../src/games/entities/game.entity';

describe('Games integration (e2e)', () => {
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

  it('creates game with multiple publisherIds and developerIds', async () => {
    const publisher1 = await request(app.getHttpServer())
      .post('/publishers')
      .send({ fullName: 'Publisher 1' })
      .expect(201);

    const publisher2 = await request(app.getHttpServer())
      .post('/publishers')
      .send({ fullName: 'Publisher 2' })
      .expect(201);

    const developer1 = await request(app.getHttpServer())
      .post('/developers')
      .send({ fullName: 'Developer 1' })
      .expect(201);

    const developer2 = await request(app.getHttpServer())
      .post('/developers')
      .send({ fullName: 'Developer 2' })
      .expect(201);

    const created = await request(app.getHttpServer())
      .post('/games')
      .send({
        title: 'Game With Teams',
        publisherIds: [publisher1.body.id, publisher2.body.id],
        developerIds: [developer1.body.id, developer2.body.id],
      })
      .expect(201);

    const loaded = await request(app.getHttpServer())
      .get(`/games/${created.body.id}`)
      .expect(200);

    expect(loaded.body.publishers).toHaveLength(2);
    expect(loaded.body.developers).toHaveLength(2);
  });

  it('updates and clears relations using arrays', async () => {
    const publisher = await request(app.getHttpServer())
      .post('/publishers')
      .send({ fullName: 'Publisher A' })
      .expect(201);

    const publisher2 = await request(app.getHttpServer())
      .post('/publishers')
      .send({ fullName: 'Publisher B' })
      .expect(201);

    const developer = await request(app.getHttpServer())
      .post('/developers')
      .send({ fullName: 'Developer A' })
      .expect(201);

    const developer2 = await request(app.getHttpServer())
      .post('/developers')
      .send({ fullName: 'Developer B' })
      .expect(201);

    const game = await request(app.getHttpServer())
      .post('/games')
      .send({
        title: 'Mutable Game',
        publisherIds: [publisher.body.id],
        developerIds: [developer.body.id],
      })
      .expect(201);

    const replaced = await request(app.getHttpServer())
      .put(`/games/${game.body.id}`)
      .send({
        publisherIds: [publisher2.body.id],
        developerIds: [developer2.body.id],
      })
      .expect(200);

    expect(replaced.body.publishers).toHaveLength(1);
    expect(replaced.body.developers).toHaveLength(1);

    const cleared = await request(app.getHttpServer())
      .put(`/games/${game.body.id}`)
      .send({
        publisherIds: [],
        developerIds: [],
      })
      .expect(200);

    expect(cleared.body.publishers).toHaveLength(0);
    expect(cleared.body.developers).toHaveLength(0);
  });

  it('returns 422 for non-existing relation IDs', async () => {
    await request(app.getHttpServer())
      .post('/games')
      .send({
        title: 'Invalid Game',
        publisherIds: ['550e8400-e29b-41d4-a716-446655440001'],
      })
      .expect(422);
  });

  it('deleting publisher/developer keeps game and clears links', async () => {
    const publisher = await request(app.getHttpServer())
      .post('/publishers')
      .send({ fullName: 'Publisher X' })
      .expect(201);

    const developer = await request(app.getHttpServer())
      .post('/developers')
      .send({ fullName: 'Developer X' })
      .expect(201);

    const game = await request(app.getHttpServer())
      .post('/games')
      .send({
        title: 'Safe Deletion Game',
        publisherIds: [publisher.body.id],
        developerIds: [developer.body.id],
      })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/publishers/${publisher.body.id}`)
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/developers/${developer.body.id}`)
      .expect(200);

    const loaded = await request(app.getHttpServer())
      .get(`/games/${game.body.id}`)
      .expect(200);

    expect(loaded.body.publishers).toHaveLength(0);
    expect(loaded.body.developers).toHaveLength(0);
  });

  it('swagger contains publishers/developers tags and multipart for create/update', () => {
    const config = new DocumentBuilder()
      .setTitle('Test')
      .setDescription('Test API')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    const publishersTags = document.paths['/publishers']?.post?.tags || [];
    const developersTags = document.paths['/developers']?.post?.tags || [];

    expect(publishersTags).toContain('publishers');
    expect(developersTags).toContain('developers');
    expect(JSON.stringify(document)).toContain('multipart/form-data');
  });
});
