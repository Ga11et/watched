import { DataSource, Repository } from 'typeorm';
import { JwtService } from './jwt.service';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';

describe('JwtService', () => {
  let dataSource: DataSource;
  let usersRepository: Repository<User>;
  let authService: AuthService;
  let jwtService: JwtService;
  let originalJwtSecret: string | undefined;
  let originalJwtExpiresIn: string | undefined;
  let originalJwtAlgorithm: string | undefined;

  beforeEach(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    originalJwtExpiresIn = process.env.JWT_EXPIRES_IN;
    originalJwtAlgorithm = process.env.JWT_ALGORITHM;

    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '24h';
    process.env.JWT_ALGORITHM = 'HS256';

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
  });

  afterEach(async () => {
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.JWT_EXPIRES_IN = originalJwtExpiresIn;
    process.env.JWT_ALGORITHM = originalJwtAlgorithm;

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      });

      const token = jwtService.generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should include user data in token payload', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      });

      const token = jwtService.generateToken(user);
      const decoded = jwtService.verifyToken(token);

      expect(decoded.userId).toBe(user.id);
      expect(decoded.username).toBe(user.username);
      expect(decoded.role).toBe(user.role);
    });

    it('should throw error when JWT_SECRET is missing', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      });
      delete process.env.JWT_SECRET;

      expect(() => jwtService.generateToken(user)).toThrow(
        'JWT secret is not configured',
      );
    });

    it('should use custom expiresIn when provided', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      });

      const token = jwtService.generateToken(user, { expiresIn: '1h' });
      const decoded = jwtService.verifyToken(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(
        (decoded.exp as number) - (decoded.iat as number),
      ).toBeLessThanOrEqual(3600);
    });

    it('should not expose sensitive fields in token payload', async () => {
      const user = await authService.register({
        name: 'Sensitive User',
        password: 'password123',
        username: 'sensitive-user',
      });

      const token = jwtService.generateToken(user);
      const decoded = jwtService.verifyToken(token) as unknown as Record<
        string,
        unknown
      >;

      expect(decoded.passwordHash).toBeUndefined();
      expect(decoded.email).toBeUndefined();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      });

      const token = jwtService.generateToken(user);
      const decoded = jwtService.verifyToken(token);

      expect(decoded.userId).toBe(user.id);
    });

    it('should throw error for invalid token', () => {
      expect(() => jwtService.verifyToken('invalid-token')).toThrow(
        'Invalid token',
      );
    });

    it('should throw error for expired token', async () => {
      const user = await authService.register({
        name: 'Test User',
        password: 'password123',
        username: 'testuser',
      });

      const expiredToken = jwtService.generateToken(user, { expiresIn: '-1h' });

      expect(() => jwtService.verifyToken(expiredToken)).toThrow(
        'Token expired',
      );
    });

    it('should throw invalid token when verification algorithm mismatches', async () => {
      const user = await authService.register({
        name: 'Algo User',
        password: 'password123',
        username: 'algo-user',
      });

      const token = jwtService.generateToken(user);
      process.env.JWT_ALGORITHM = 'HS512';

      expect(() => jwtService.verifyToken(token)).toThrow('Invalid token');
    });

    it('should throw invalid token when secret changed after token generation', async () => {
      const user = await authService.register({
        name: 'Secret User',
        password: 'password123',
        username: 'secret-user',
      });

      const token = jwtService.generateToken(user);
      process.env.JWT_SECRET = 'another-secret-key';

      expect(() => jwtService.verifyToken(token)).toThrow('Invalid token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract bearer token from authorization header', () => {
      const token = jwtService.extractTokenFromHeader({
        headers: { authorization: 'Bearer token-value' },
      });

      expect(token).toBe('token-value');
    });

    it('should return null for missing authorization header', () => {
      const token = jwtService.extractTokenFromHeader({ headers: {} });

      expect(token).toBeNull();
    });

    it('should return null for malformed authorization header', () => {
      const token = jwtService.extractTokenFromHeader({
        headers: { authorization: 'Basic token-value' },
      });

      expect(token).toBeNull();
    });

    it('should extract token from Authorization header with uppercase key', () => {
      const token = jwtService.extractTokenFromHeader({
        headers: { Authorization: 'Bearer token-value-upper' },
      });

      expect(token).toBe('token-value-upper');
    });

    it('should return null when authorization header is an array', () => {
      const token = jwtService.extractTokenFromHeader({
        headers: { authorization: ['Bearer token-value'] },
      });

      expect(token).toBeNull();
    });

    it('should return null for lowercase bearer prefix', () => {
      const token = jwtService.extractTokenFromHeader({
        headers: { authorization: 'bearer token-value' },
      });

      expect(token).toBeNull();
    });

    it('should return null for bearer header with empty token', () => {
      const token = jwtService.extractTokenFromHeader({
        headers: { authorization: 'Bearer   ' },
      });

      expect(token).toBeNull();
    });
  });
});
