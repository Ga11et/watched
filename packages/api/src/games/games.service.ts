import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import { Game } from './entities/game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Publisher } from '../publishers/entities/publisher.entity';
import { Developer } from '../developers/entities/developer.entity';
import * as fs from 'fs';
import * as path from 'path';
import { isUuid } from '../common/utils/uuid.util';

@Injectable()
export class GamesService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'games');

  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
    @InjectRepository(Publisher)
    private publishersRepository: Repository<Publisher>,
    @InjectRepository(Developer)
    private developersRepository: Repository<Developer>,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async create(
    createGameDto: CreateGameDto,
    cover?: Express.Multer.File,
  ): Promise<Game> {
    if (!createGameDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании игры',
        violations: [{ field: 'title', message: 'Название обязательно' }],
      });
    }

    let coverPath: string | null = null;

    if (cover) {
      const fileName = `${Date.now()}-${cover.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, cover.buffer);
      coverPath = `/uploads/games/${fileName}`;
    }

    const publishers = await this.resolvePublishers(
      createGameDto.publisherIds,
      'Произошла ошибка при создании игры',
    );
    const developers = await this.resolveDevelopers(
      createGameDto.developerIds,
      'Произошла ошибка при создании игры',
    );

    const game = this.gamesRepository.create({
      ...createGameDto,
      cover: coverPath,
      completionDate: createGameDto.completionDate
        ? new Date(createGameDto.completionDate)
        : new Date(),
      publishers,
      developers,
    });

    return this.gamesRepository.save(game);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    limit?: string,
  ): Promise<Game[]> {
    const queryBuilder = this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.publishers', 'publisher')
      .leftJoinAndSelect('game.developers', 'developer');

    if (sortBy) {
      const validSortFields = [
        'title',
        'completionDate',
        'rating',
        'playTimeHours',
      ];
      if (validSortFields.includes(sortBy)) {
        queryBuilder.orderBy(`game.${sortBy}`, sortOrder || 'ASC');
      }
    } else {
      queryBuilder.orderBy('game.completionDate', 'DESC');
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        queryBuilder.limit(limitNum);
      }
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Game> {
    if (!isUuid(id)) {
      throw new NotFoundException(`Игра с ID ${id} не найдена`);
    }

    const game = await this.gamesRepository.findOne({
      where: { id },
      relations: {
        publishers: true,
        developers: true,
      },
    });

    if (!game) {
      throw new NotFoundException(`Игра с ID ${id} не найдена`);
    }

    return game;
  }

  async update(
    id: string,
    updateGameDto: UpdateGameDto,
    cover?: Express.Multer.File,
  ): Promise<Game> {
    if (updateGameDto.title !== undefined && !updateGameDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении игры',
        violations: [
          { field: 'title', message: 'Название не может быть пустым' },
        ],
      });
    }

    const game = await this.findOne(id);

    if (game.cover && (updateGameDto.removeCover || cover)) {
      const oldCoverPath = path.join(process.cwd(), game.cover);
      if (fs.existsSync(oldCoverPath)) {
        fs.unlinkSync(oldCoverPath);
      }
      game.cover = null;
    }

    if (cover) {
      const fileName = `${Date.now()}-${cover.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, cover.buffer);
      game.cover = `/uploads/games/${fileName}`;
    }

    if (updateGameDto.publisherIds !== undefined) {
      game.publishers = await this.resolvePublishers(
        updateGameDto.publisherIds,
        'Произошла ошибка при обновлении игры',
      );
    }

    if (updateGameDto.developerIds !== undefined) {
      game.developers = await this.resolveDevelopers(
        updateGameDto.developerIds,
        'Произошла ошибка при обновлении игры',
      );
    }

    const updatedGame = {
      ...game,
      ...updateGameDto,
      cover: game.cover,
      completionDate: updateGameDto.completionDate
        ? new Date(updateGameDto.completionDate)
        : game.completionDate,
    };
    return this.gamesRepository.save(updatedGame);
  }

  async remove(id: string): Promise<void> {
    const game = await this.findOne(id);

    if (game.cover) {
      const coverPath = path.join(process.cwd(), game.cover);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

    await this.gamesRepository.delete(id);
  }

  async getStats(): Promise<{
    total: number;
    thisMonth: number;
    avgRating: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, thisMonth, avgRatingResult] = await Promise.all([
      this.gamesRepository.count(),
      this.gamesRepository.count({
        where: {
          completionDate: MoreThanOrEqual(startOfMonth),
        },
      }),
      this.gamesRepository
        .createQueryBuilder('game')
        .select('AVG(game.rating)', 'avgRating')
        .where('game.rating IS NOT NULL')
        .getRawOne<{ avgRating: string | null }>(),
    ]);

    return {
      total,
      thisMonth,
      avgRating: avgRatingResult?.avgRating
        ? parseFloat(avgRatingResult.avgRating)
        : 0,
    };
  }

  private async resolvePublishers(
    publisherIds: string[] | undefined,
    errorMessage: string,
  ): Promise<Publisher[]> {
    if (publisherIds === undefined) {
      return [];
    }

    if (publisherIds.length === 0) {
      return [];
    }

    const publishers = await this.publishersRepository.findBy({
      id: In(publisherIds),
    });

    const foundIds = new Set(publishers.map((publisher) => publisher.id));
    const missingPublisherIds = publisherIds.filter((id) => !foundIds.has(id));

    if (missingPublisherIds.length > 0) {
      throw new UnprocessableEntityException({
        message: errorMessage,
        violations: [
          {
            field: 'publisherIds',
            message: `Издатели не найдены: ${missingPublisherIds.join(', ')}`,
          },
        ],
      });
    }

    return publishers;
  }

  private async resolveDevelopers(
    developerIds: string[] | undefined,
    errorMessage: string,
  ): Promise<Developer[]> {
    if (developerIds === undefined) {
      return [];
    }

    if (developerIds.length === 0) {
      return [];
    }

    const developers = await this.developersRepository.findBy({
      id: In(developerIds),
    });

    const foundIds = new Set(developers.map((developer) => developer.id));
    const missingDeveloperIds = developerIds.filter((id) => !foundIds.has(id));

    if (missingDeveloperIds.length > 0) {
      throw new UnprocessableEntityException({
        message: errorMessage,
        violations: [
          {
            field: 'developerIds',
            message: `Разработчики не найдены: ${missingDeveloperIds.join(', ')}`,
          },
        ],
      });
    }

    return developers;
  }
}
