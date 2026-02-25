import { DataSource, Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/entities/user.entity';

describe('AuthService', () => {
  let dataSource: DataSource;
  let usersRepository: Repository<User>;
  let authService: AuthService;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [User],
      synchronize: true,
      dropSchema: true,
    });

    await dataSource.initialize();

    usersRepository = dataSource.getRepository(User);
    authService = new AuthService(usersRepository);
  });

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        name: 'New User',
        password: 'password123',
        username: 'newuser',
      };

      const user = await authService.register(userData);

      expect(user.id).toBeDefined();
      expect(user.passwordHash).not.toBe(userData.password);
      expect(user.role).toBe(UserRole.USER);
    });

    it('should register user without username', async () => {
      const userData = {
        name: 'New User',
        password: 'password123',
      };

      const user = await authService.register(userData);

      expect(user.id).toBeDefined();
      expect(user.username).toBeNull();
      expect(user.passwordHash).not.toBe(userData.password);
      expect(user.role).toBe(UserRole.USER);
    });

    it('should throw error for duplicate username', async () => {
      await authService.register({
        name: 'Test User 1',
        password: 'password123',
        username: 'testuser',
      });

      await expect(
        authService.register({
          name: 'Test User 2',
          password: 'password456',
          username: 'testuser',
        }),
      ).rejects.toThrow('Username already exists');
    });

    it('should throw error for duplicate email', async () => {
      await authService.register({
        name: 'Test User 1',
        password: 'password123',
        email: 'test@example.com',
      });

      await expect(
        authService.register({
          name: 'Test User 2',
          password: 'password456',
          email: 'test@example.com',
        }),
      ).rejects.toThrow('Email already exists');
    });

    it('should trim name, username and email before saving', async () => {
      const user = await authService.register({
        name: '  New User  ',
        password: 'password123',
        username: '  newuser  ',
        email: '  test@example.com  ',
      });

      expect(user.name).toBe('New User');
      expect(user.username).toBe('newuser');
      expect(user.email).toBe('test@example.com');
    });

    it('should treat blank username and email as null', async () => {
      const user = await authService.register({
        name: 'New User',
        password: 'password123',
        username: '   ',
        email: '   ',
      });

      expect(user.username).toBeNull();
      expect(user.email).toBeNull();
    });

    it('should throw error when name is blank', async () => {
      await expect(
        authService.register({
          name: '   ',
          password: 'password123',
        }),
      ).rejects.toThrow('Name is required');
    });

    it('should throw error when password is blank', async () => {
      await expect(
        authService.register({
          name: 'New User',
          password: '   ',
        }),
      ).rejects.toThrow('Password is required');
    });

    it('should allow multiple users without username and email', async () => {
      const user1 = await authService.register({
        name: 'User One',
        password: 'password123',
      });

      const user2 = await authService.register({
        name: 'User Two',
        password: 'password456',
      });

      expect(user1.id).not.toBe(user2.id);
      expect(user1.username).toBeNull();
      expect(user2.username).toBeNull();
      expect(user1.email).toBeNull();
      expect(user2.email).toBeNull();
    });
  });

  describe('login', () => {
    it('should authenticate user with username', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      });

      const result = await authService.login('testuser', 'password123');

      expect(result.user.id).toBe(user.id);
      expect(result.token).toBeDefined();
    });

    it('should authenticate user with email', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
        email: 'test@example.com',
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(result.user.id).toBe(user.id);
      expect(result.token).toBeDefined();
    });

    it('should authenticate user with trimmed identifier', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      });

      const result = await authService.login('  testuser  ', 'password123');

      expect(result.user.id).toBe(user.id);
    });

    it('should generate different token for each successful login', async () => {
      await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      });

      const result1 = await authService.login('testuser', 'password123');
      const result2 = await authService.login('testuser', 'password123');

      expect(result1.token).toBeDefined();
      expect(result2.token).toBeDefined();
      expect(result1.token).not.toBe(result2.token);
    });

    it('should authenticate user with name when no username', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
      });

      const result = await authService.login('Test User', 'password123');

      expect(result.user.id).toBe(user.id);
      expect(result.token).toBeDefined();
    });

    it('should throw error for invalid password', async () => {
      await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      });

      await expect(
        authService.login('testuser', 'wrongpassword'),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.login('nonexistent', 'password'),
      ).rejects.toThrow('User not found');
    });
  });

  describe('password hashing', () => {
    it('should hash password consistently', async () => {
      const password = 'testpassword';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);

      expect(hash1).not.toBe(password);
      expect(hash2).not.toBe(password);
      expect(hash1).not.toBe(hash2);
    });

    it('should verify password correctly', async () => {
      const password = 'testpassword';
      const hash = await authService.hashPassword(password);

      expect(await authService.verifyPassword(password, hash)).toBe(true);
      expect(await authService.verifyPassword('wrongpassword', hash)).toBe(
        false,
      );
    });

    it('should generate bcrypt hash format', async () => {
      const hash = await authService.hashPassword('testpassword');

      expect(hash.startsWith('$2')).toBe(true);
      expect(hash.length).toBeGreaterThan(20);
    });
  });
});
