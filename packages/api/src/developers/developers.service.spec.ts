import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { DevelopersService } from './developers.service';
import { Developer } from './entities/developer.entity';
import { Publisher } from '../publishers/entities/publisher.entity';
import { Game } from '../games/entities/game.entity';

describe('DevelopersService', () => {
  let dataSource: DataSource;
  let developersRepository: Repository<Developer>;
  let gamesRepository: Repository<Game>;
  let publishersRepository: Repository<Publisher>;
  let service: DevelopersService;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Developer, Publisher, Game],
      synchronize: true,
      dropSchema: true,
    });

    await dataSource.initialize();

    developersRepository = dataSource.getRepository(Developer);
    gamesRepository = dataSource.getRepository(Game);
    publishersRepository = dataSource.getRepository(Publisher);
    service = new DevelopersService(developersRepository, gamesRepository);
  });

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('create: creates developer with valid fullName', async () => {
    const result = await service.create({ fullName: 'Larian Studios' });

    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('Larian Studios');
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

  it('update: updates developer fields', async () => {
    const created = await service.create({ fullName: 'Old Studio' });

    const updated = await service.update(created.id, {
      fullName: 'New Studio',
      comment: 'Updated',
    });

    expect(updated.fullName).toBe('New Studio');
    expect(updated.comment).toBe('Updated');
  });

  it('remove: removes relation from games before deleting developer', async () => {
    const developer = await service.create({ fullName: 'To Delete' });
    const publisher = await publishersRepository.save(
      publishersRepository.create({
        fullName: 'CD Projekt',
      }),
    );

    const game = await gamesRepository.save(
      gamesRepository.create({
        title: 'Cyberpunk 2077',
        completionDate: new Date(),
        publishers: [publisher],
        developers: [developer],
      }),
    );

    await service.remove(developer.id);

    const updatedGame = await gamesRepository.findOne({
      where: { id: game.id },
      relations: {
        developers: true,
      },
    });

    expect(updatedGame).toBeDefined();
    expect(updatedGame?.developers).toHaveLength(0);
  });

  it('getStats: returns total count', async () => {
    await service.create({ fullName: 'A' });
    await service.create({ fullName: 'B' });

    const stats = await service.getStats();

    expect(stats).toEqual({ total: 2 });
  });
});
