import { DataSource } from 'typeorm';
import { Developer } from './developer.entity';
import { Publisher } from '../../publishers/entities/publisher.entity';
import { Game } from '../../games/entities/game.entity';

describe('Developer entity', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Developer, Publisher, Game],
      synchronize: true,
      dropSchema: true,
    });

    await dataSource.initialize();
  });

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('creates entity with valid fullName', async () => {
    const repository = dataSource.getRepository(Developer);

    const created = repository.create({
      fullName: 'Larian Studios',
    });

    const saved = await repository.save(created);

    expect(saved.id).toBeDefined();
    expect(saved.fullName).toBe('Larian Studios');
  });

  it('allows nullable fields to be null', async () => {
    const repository = dataSource.getRepository(Developer);

    const saved = await repository.save(
      repository.create({
        fullName: 'FromSoftware',
        comment: null,
        photo: null,
      }),
    );

    expect(saved.comment).toBeNull();
    expect(saved.photo).toBeNull();
  });

  it('sets timestamps', async () => {
    const repository = dataSource.getRepository(Developer);

    const saved = await repository.save(
      repository.create({
        fullName: 'Capcom',
      }),
    );

    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });
});
