/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';
import { UserBook } from '../user-lists/entities/user-book.entity';
import { UserMovie } from '../user-lists/entities/user-movie.entity';
import { UserSeries } from '../user-lists/entities/user-series.entity';
import { UserGame } from '../user-lists/entities/user-game.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;
  let userBooksRepository: Repository<UserBook>;
  let userMoviesRepository: Repository<UserMovie>;
  let userSeriesRepository: Repository<UserSeries>;
  let userGamesRepository: Repository<UserGame>;

  const mockUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: '$2b$10$hash',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date('2026-01-22T17:00:00Z'),
    updatedAt: new Date('2026-01-22T17:00:00Z'),
  };

  const mockAdminUser: User = {
    ...mockUser,
    id: '550e8400-e29b-41d4-a716-446655440002',
    username: 'admin',
    email: 'admin@example.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserBook),
          useValue: {
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserMovie),
          useValue: {
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserSeries),
          useValue: {
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserGame),
          useValue: {
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    userBooksRepository = module.get<Repository<UserBook>>(
      getRepositoryToken(UserBook),
    );
    userMoviesRepository = module.get<Repository<UserMovie>>(
      getRepositoryToken(UserMovie),
    );
    userSeriesRepository = module.get<Repository<UserSeries>>(
      getRepositoryToken(UserSeries),
    );
    userGamesRepository = module.get<Repository<UserGame>>(
      getRepositoryToken(UserGame),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserByIdentifier', () => {
    it('should return user when identifier is valid UUID', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.getUserByIdentifier(
        '550e8400-e29b-41d4-a716-446655440001',
      );

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
      });
    });

    it('should return user when identifier is valid username', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.getUserByIdentifier('testuser');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('should return null when user does not exist by UUID', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.getUserByIdentifier(
        '550e8400-e29b-41d4-a716-446655440099',
      );

      expect(result).toBeNull();
    });

    it('should return null when user does not exist by username', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      const result = await service.getUserByIdentifier('nonexistent');

      expect(result).toBeNull();
    });

    it('should prioritize UUID match over username match', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.getUserByIdentifier(
        '550e8400-e29b-41d4-a716-446655440001',
      );

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-446655440001' },
      });
    });
  });

  describe('getUserByIdentifierOrFail', () => {
    it('should return user when found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      const result = await service.getUserByIdentifierOrFail('testuser');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getUserByIdentifierOrFail('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllUsers', () => {
    it('should return only active users for ROLE.USER', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAllUsers(UserRole.USER, {});

      expect(result).toEqual([mockUser]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should return only active users for ROLE.GUEST', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAllUsers(UserRole.GUEST, {});

      expect(result).toEqual([mockUser]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should return all users for ROLE.ADMIN', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser, mockAdminUser]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAllUsers(UserRole.ADMIN, {});

      expect(result).toEqual([mockUser, mockAdminUser]);
      expect(mockQueryBuilder.where).not.toHaveBeenCalled();
    });

    it('should filter by role for ADMIN only', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAdminUser]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAllUsers(UserRole.ADMIN, {
        role: UserRole.ADMIN,
      });

      expect(result).toEqual([mockAdminUser]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.role = :role',
        { role: UserRole.ADMIN },
      );
    });

    it('should ignore role filter for non-ADMIN users', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.getAllUsers(UserRole.USER, { role: UserRole.ADMIN });

      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        expect.stringContaining('user.role'),
        expect.anything(),
      );
    });

    it('should filter by isActive for ADMIN only', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.getAllUsers(UserRole.ADMIN, { isActive: false });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.isActive = :isActive',
        { isActive: false },
      );
    });

    it('should ignore isActive filter for non-ADMIN users', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.getAllUsers(UserRole.USER, { isActive: false });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should search by name case-insensitive', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.getAllUsers(UserRole.USER, { search: 'test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(user.name) LIKE :search OR LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: '%test%' },
      );
    });

    it('should search by username case-insensitive', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.getAllUsers(UserRole.USER, { search: 'admin' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(user.name) LIKE :search OR LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: '%admin%' },
      );
    });

    it('should search by email case-insensitive', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.getAllUsers(UserRole.USER, { search: 'example.com' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(user.name) LIKE :search OR LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: '%example.com%' },
      );
    });

    it('should combine search with role filter (ADMIN only)', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.getAllUsers(UserRole.ADMIN, {
        role: UserRole.USER,
        search: 'john',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'user.role = :role',
        { role: UserRole.USER },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(user.name) LIKE :search OR LOWER(user.username) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: '%john%' },
      );
    });

    it('should return users sorted by createdAt descending', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockUser]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.getAllUsers(UserRole.USER, {});

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'user.createdAt',
        'DESC',
      );
    });

    it('should return empty array when no users match', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(repository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getAllUsers(UserRole.USER, {
        search: 'nonexistent',
      });

      expect(result).toEqual([]);
    });
  });

  describe('updateUserProfile', () => {
    it('should update user name', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockUser,
        name: 'New Name',
      });

      const result = await service.updateUserProfile('testuser', {
        name: 'New Name',
      });

      expect(result.name).toBe('New Name');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should update user email', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockUser,
        email: 'newemail@example.com',
      });

      const result = await service.updateUserProfile('testuser', {
        email: 'newemail@example.com',
      });

      expect(result.email).toBe('newemail@example.com');
    });

    it('should update user username', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockUser,
        username: 'newusername',
      });

      const result = await service.updateUserProfile('testuser', {
        username: 'newusername',
      });

      expect(result.username).toBe('newusername');
    });

    it('should set username to null', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockUser,
        username: null,
      });

      const result = await service.updateUserProfile('testuser', {
        username: null,
      });

      expect(result.username).toBeNull();
    });

    it('should set email to null', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockUser,
        email: null,
      });

      const result = await service.updateUserProfile('testuser', {
        email: null,
      });

      expect(result.email).toBeNull();
    });

    it('should reject duplicate username', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockAdminUser);

      await expect(
        service.updateUserProfile('testuser', { username: 'admin' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate email', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockAdminUser);

      await expect(
        service.updateUserProfile('testuser', { email: 'admin@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid email format', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      await expect(
        service.updateUserProfile('testuser', { email: 'invalid-email' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject username with invalid characters', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      await expect(
        service.updateUserProfile('testuser', { username: 'invalid-user!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject update when user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateUserProfile('nonexistent', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow partial updates', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockUser,
        name: 'New Name',
      });

      const result = await service.updateUserProfile('testuser', {
        name: 'New Name',
      });

      expect(result.name).toBe('New Name');
      expect(result.username).toBe(mockUser.username);
      expect(result.email).toBe(mockUser.email);
    });
  });

  describe('adminUpdateUser', () => {
    it('should update user role', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockUser,
        role: UserRole.ADMIN,
      });

      const result = await service.adminUpdateUser('testuser', {
        role: UserRole.ADMIN,
      });

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should reject duplicate username even for admin', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(repository, 'findOne').mockResolvedValueOnce(mockAdminUser);

      await expect(
        service.adminUpdateUser('testuser', { username: 'admin' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('adminDeleteUser', () => {
    it('should hard-delete user and remove user-list entities', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'remove').mockResolvedValue(mockUser);
      jest.spyOn(userBooksRepository, 'delete').mockResolvedValue({} as any);
      jest.spyOn(userMoviesRepository, 'delete').mockResolvedValue({} as any);
      jest.spyOn(userSeriesRepository, 'delete').mockResolvedValue({} as any);
      jest.spyOn(userGamesRepository, 'delete').mockResolvedValue({} as any);

      await service.adminDeleteUser('testuser', mockAdminUser.id);

      expect(userBooksRepository.delete).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
      expect(userMoviesRepository.delete).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
      expect(userSeriesRepository.delete).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
      expect(userGamesRepository.delete).toHaveBeenCalledWith({
        userId: mockUser.id,
      });
      expect(repository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should prevent self-deletion', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);

      await expect(
        service.adminDeleteUser(
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440001',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.adminDeleteUser('nonexistent', mockAdminUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('adminChangeUserRole', () => {
    it('should change user role', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockUser,
        role: UserRole.ADMIN,
      });

      const result = await service.adminChangeUserRole('testuser', {
        role: UserRole.ADMIN,
      });

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(
        service.adminChangeUserRole('nonexistent', { role: UserRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
