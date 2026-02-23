import { DataSource } from 'typeorm';
import { Publisher } from './publisher.entity';
import { Developer } from '../../developers/entities/developer.entity';
import { Game } from '../../games/entities/game.entity';

describe('Publisher entity', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [Publisher, Developer, Game],
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
    const repository = dataSource.getRepository(Publisher);

    const created = repository.create({
      fullName: 'CD Projekt',
    });

    const saved = await repository.save(created);

    expect(saved.id).toBeDefined();
    expect(saved.fullName).toBe('CD Projekt');
  });

  it('allows nullable fields to be null', async () => {
    const repository = dataSource.getRepository(Publisher);

    const saved = await repository.save(
      repository.create({
        fullName: 'Valve',
        comment: null,
        photo: null,
      }),
    );

    expect(saved.comment).toBeNull();
    expect(saved.photo).toBeNull();
  });

  it('sets timestamps', async () => {
    const repository = dataSource.getRepository(Publisher);

    const saved = await repository.save(
      repository.create({
        fullName: 'Nintendo',
      }),
    );

    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });
});
