import { UnprocessableEntityException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GamesService } from './games.service';
import { Game } from './entities/game.entity';
import { Publisher } from '../publishers/entities/publisher.entity';
import { Developer } from '../developers/entities/developer.entity';

describe('GamesService', () => {
  let dataSource: DataSource;
  let gamesRepository: Repository<Game>;
  let publishersRepository: Repository<Publisher>;
  let developersRepository: Repository<Developer>;
  let service: GamesService;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Game, Publisher, Developer],
      synchronize: true,
      dropSchema: true,
    });

    await dataSource.initialize();

    gamesRepository = dataSource.getRepository(Game);
    publishersRepository = dataSource.getRepository(Publisher);
    developersRepository = dataSource.getRepository(Developer);

    service = new GamesService(
      gamesRepository,
      publishersRepository,
      developersRepository,
    );
  });

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('create: creates game with multiple publishers and developers', async () => {
    const publisher1 = await publishersRepository.save(
      publishersRepository.create({ fullName: 'Publisher 1' }),
    );
    const publisher2 = await publishersRepository.save(
      publishersRepository.create({ fullName: 'Publisher 2' }),
    );

    const developer1 = await developersRepository.save(
      developersRepository.create({ fullName: 'Developer 1' }),
    );
    const developer2 = await developersRepository.save(
      developersRepository.create({ fullName: 'Developer 2' }),
    );

    const created = await service.create({
      title: 'Test Game',
      completionDate: '2025-01-01',
      publisherIds: [publisher1.id, publisher2.id],
      developerIds: [developer1.id, developer2.id],
    });

    expect(created.id).toBeDefined();

    const loaded = await service.findOne(created.id);
    expect(loaded.publishers).toHaveLength(2);
    expect(loaded.developers).toHaveLength(2);
  });

  it('create: throws 422 for non-existing publisher ids', async () => {
    await expect(
      service.create({
        title: 'Invalid Game',
        publisherIds: ['550e8400-e29b-41d4-a716-446655440001'],
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('update: clears relations when empty arrays passed', async () => {
    const publisher = await publishersRepository.save(
      publishersRepository.create({ fullName: 'Publisher' }),
    );
    const developer = await developersRepository.save(
      developersRepository.create({ fullName: 'Developer' }),
    );

    const created = await service.create({
      title: 'Relation Game',
      publisherIds: [publisher.id],
      developerIds: [developer.id],
    });

    const updated = await service.update(created.id, {
      publisherIds: [],
      developerIds: [],
    });

    expect(updated.publishers).toHaveLength(0);
    expect(updated.developers).toHaveLength(0);
  });

  it('findAll: returns games with loaded relations', async () => {
    const publisher = await publishersRepository.save(
      publishersRepository.create({ fullName: 'Publisher' }),
    );
    const developer = await developersRepository.save(
      developersRepository.create({ fullName: 'Developer' }),
    );

    await service.create({
      title: 'Game With Relations',
      publisherIds: [publisher.id],
      developerIds: [developer.id],
    });

    const games = await service.findAll();

    expect(games).toHaveLength(1);
    expect(games[0].publishers).toHaveLength(1);
    expect(games[0].developers).toHaveLength(1);
  });
});
