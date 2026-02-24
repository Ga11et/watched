import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PublishersService } from './publishers.service';
import { Publisher } from './entities/publisher.entity';
import { Game } from '../games/entities/game.entity';
import { Developer } from '../developers/entities/developer.entity';

describe('PublishersService', () => {
  let dataSource: DataSource;
  let publishersRepository: Repository<Publisher>;
  let gamesRepository: Repository<Game>;
  let developersRepository: Repository<Developer>;
  let service: PublishersService;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Publisher, Developer, Game],
      synchronize: true,
      dropSchema: true,
    });

    await dataSource.initialize();

    publishersRepository = dataSource.getRepository(Publisher);
    gamesRepository = dataSource.getRepository(Game);
    developersRepository = dataSource.getRepository(Developer);
    service = new PublishersService(publishersRepository, gamesRepository);
  });

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('create: creates publisher with valid fullName', async () => {
    const result = await service.create({ fullName: 'CD Projekt' });

    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('CD Projekt');
  });

  it('create: throws 422 for empty fullName', async () => {
    await expect(service.create({ fullName: '   ' })).rejects.toThrow(
      UnprocessableEntityException,
    );
  });

  it('findOne: throws 404 for unknown id', async () => {
    await expect(
      service.findOne('550e8400-e29b-41d4-a716-446655440000'),
    ).rejects.toThrow(NotFoundException);
  });

  it('findOne: returns publisher with linked games', async () => {
    const publisher = await service.create({ fullName: 'Linked Publisher' });
    const developer = await developersRepository.save(
      developersRepository.create({ fullName: 'Linked Studio' }),
    );

    const game = await gamesRepository.save(
      gamesRepository.create({
        title: 'Linked Game',
        completionDate: new Date(),
        publishers: [publisher],
        developers: [developer],
      }),
    );

    const found = await service.findOne(publisher.id);

    expect(found.games).toBeDefined();
    expect(found.games).toHaveLength(1);
    expect(found.games[0].id).toBe(game.id);
    expect(found.games[0].title).toBe('Linked Game');
  });

  it('update: updates publisher fields', async () => {
    const created = await service.create({ fullName: 'Old Name' });

    const updated = await service.update(created.id, {
      fullName: 'New Name',
      comment: 'Updated',
    });

    expect(updated.fullName).toBe('New Name');
    expect(updated.comment).toBe('Updated');
  });

  it('remove: removes relation from games before deleting publisher', async () => {
    const publisher = await service.create({ fullName: 'To Delete' });
    const developer = await developersRepository.save(
      developersRepository.create({
        fullName: 'Larian Studios',
      }),
    );

    const game = await gamesRepository.save(
      gamesRepository.create({
        title: "Baldur's Gate 3",
        completionDate: new Date(),
        publishers: [publisher],
        developers: [developer],
      }),
    );

    await service.remove(publisher.id);

    const updatedGame = await gamesRepository.findOne({
      where: { id: game.id },
      relations: {
        publishers: true,
      },
    });

    expect(updatedGame).toBeDefined();
    expect(updatedGame?.publishers).toHaveLength(0);
  });

  it('getStats: returns total count', async () => {
    await service.create({ fullName: 'A' });
    await service.create({ fullName: 'B' });

    const stats = await service.getStats();

    expect(stats).toEqual({ total: 2 });
  });
});
