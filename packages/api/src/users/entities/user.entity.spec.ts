import { DataSource } from 'typeorm';
import { User, UserRole } from './user.entity';

describe('User Entity', () => {
  let dataSource: DataSource;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [User],
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

  it('should create user with valid data', async () => {
    const repository = dataSource.getRepository(User);

    const saved = await repository.save(
      repository.create({
        username: 'testuser',
        passwordHash: 'hashedpassword',
        name: 'Test User',
        role: UserRole.USER,
        isActive: true,
      }),
    );

    expect(saved.id).toBeDefined();
    expect(saved.createdAt).toBeInstanceOf(Date);
  });

  it('should create user without username', async () => {
    const repository = dataSource.getRepository(User);

    const saved = await repository.save(
      repository.create({
        passwordHash: 'hashedpassword',
        name: 'Test User',
        role: UserRole.USER,
        isActive: true,
      }),
    );

    expect(saved.id).toBeDefined();
    expect(saved.username).toBeNull();
  });

  it('should enforce unique username when provided', async () => {
    const repository = dataSource.getRepository(User);

    await repository.save(
      repository.create({
        username: 'testuser',
        passwordHash: 'hashedpassword-1',
        name: 'User 1',
        role: UserRole.USER,
        isActive: true,
      }),
    );

    const duplicate = repository.create({
      username: 'testuser',
      passwordHash: 'hashedpassword-2',
      name: 'User 2',
      role: UserRole.USER,
      isActive: true,
    });

    await expect(repository.save(duplicate)).rejects.toThrow();
  });

  it('should allow optional email', async () => {
    const repository = dataSource.getRepository(User);

    const saved = await repository.save(
      repository.create({
        username: 'testuser2',
        passwordHash: 'hashedpassword',
        name: 'Test User',
        role: UserRole.USER,
        isActive: true,
      }),
    );

    expect(saved.id).toBeDefined();
    expect(saved.email).toBeNull();
  });

  it('should enforce unique email when provided', async () => {
    const repository = dataSource.getRepository(User);

    await repository.save(
      repository.create({
        username: 'user1',
        email: 'test@example.com',
        passwordHash: 'hashedpassword-1',
        name: 'User 1',
        role: UserRole.USER,
        isActive: true,
      }),
    );

    const duplicate = repository.create({
      username: 'user2',
      email: 'test@example.com',
      passwordHash: 'hashedpassword-2',
      name: 'User 2',
      role: UserRole.USER,
      isActive: true,
    });

    await expect(repository.save(duplicate)).rejects.toThrow();
  });
});
