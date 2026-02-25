import { DataSource, Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { AuthMiddleware } from './auth.middleware';
import { JwtService } from './jwt.service';
import { User } from '../users/entities/user.entity';

interface TestRequest {
  headers?: Record<string, string | undefined>;
  user?: {
    id: string;
    userId: string;
    username: string | null;
    name: string;
    role: string;
  };
}

describe('AuthMiddleware', () => {
  let dataSource: DataSource;
  let usersRepository: Repository<User>;
  let authService: AuthService;
  let jwtService: JwtService;
  let authMiddleware: AuthMiddleware;
  let originalJwtSecret: string | undefined;

  beforeEach(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'test-secret-key';

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
    jwtService = new JwtService();
    authMiddleware = new AuthMiddleware(jwtService);
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('should pass request with valid token', async () => {
    const user = await authService.register({
      name: 'Test User',
      password: 'password123',
      username: 'testuser',
    });

    const token = jwtService.generateToken(user);
    const request: TestRequest = {
      headers: { authorization: `Bearer ${token}` },
    };

    await authMiddleware.use(request);

    expect((request.user as { id: string }).id).toBe(user.id);
  });

  it('should attach complete auth payload to request.user', async () => {
    const user = await authService.register({
      name: 'Payload User',
      password: 'password123',
      username: 'payload-user',
    });

    const token = jwtService.generateToken(user);
    const request: TestRequest = {
      headers: { authorization: `Bearer ${token}` },
    };

    await authMiddleware.use(request);
    const authUser = request.user as {
      id: string;
      userId: string;
      username: string | null;
      name: string;
      role: string;
    };

    expect(authUser.id).toBe(user.id);
    expect(authUser.userId).toBe(user.id);
    expect(authUser.username).toBe(user.username);
    expect(authUser.name).toBe(user.name);
    expect(authUser.role).toBe(user.role);
  });

  it('should throw error for missing token', async () => {
    const request: TestRequest = { headers: {} };

    await expect(authMiddleware.use(request)).rejects.toThrow(
      'Authorization token required',
    );
  });

  it('should throw error for invalid token', async () => {
    const request: TestRequest = {
      headers: { authorization: 'Bearer invalid-token' },
    };

    await expect(authMiddleware.use(request)).rejects.toThrow('Invalid token');
  });

  it('should accept Authorization header with uppercase key', async () => {
    const user = await authService.register({
      name: 'Upper Header User',
      password: 'password123',
      username: 'upper-header-user',
    });

    const token = jwtService.generateToken(user);
    const request: TestRequest = {
      headers: { Authorization: `Bearer ${token}` },
    };

    await authMiddleware.use(request);

    expect((request.user as { id: string }).id).toBe(user.id);
  });

  it('should throw error for malformed authorization scheme', async () => {
    const request: TestRequest = {
      headers: { authorization: 'Basic token-value' },
    };

    await expect(authMiddleware.use(request)).rejects.toThrow(
      'Authorization token required',
    );
  });

  it('should throw error for empty bearer token', async () => {
    const request: TestRequest = {
      headers: { authorization: 'Bearer   ' },
    };

    await expect(authMiddleware.use(request)).rejects.toThrow(
      'Authorization token required',
    );
  });

  it('should throw error when headers are missing completely', async () => {
    const request: TestRequest = {};

    await expect(authMiddleware.use(request)).rejects.toThrow(
      'Authorization token required',
    );
  });

  it('should throw token expired error for expired token', async () => {
    const user = await authService.register({
      name: 'Expired User',
      password: 'password123',
      username: 'expired-user',
    });

    const expiredToken = jwtService.generateToken(user, { expiresIn: '-1h' });
    const request: TestRequest = {
      headers: { authorization: `Bearer ${expiredToken}` },
    };

    await expect(authMiddleware.use(request)).rejects.toThrow('Token expired');
  });
});
