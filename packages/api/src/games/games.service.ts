import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Game } from './entities/game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
  ) {}

  async create(createGameDto: CreateGameDto): Promise<Game> {
    if (!createGameDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании игры',
        violations: [{ field: 'title', message: 'Название обязательно' }],
      });
    }
    const game = this.gamesRepository.create({
      ...createGameDto,
      completionDate: createGameDto.completionDate
        ? new Date(createGameDto.completionDate)
        : new Date(),
    });
    return this.gamesRepository.save(game);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    limit?: string,
  ): Promise<Game[]> {
    const queryBuilder = this.gamesRepository.createQueryBuilder('game');

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
    const game = await this.gamesRepository.findOne({ where: { id } });
    if (!game) {
      throw new NotFoundException(`Игра с ID ${id} не найдена`);
    }
    return game;
  }

  async update(id: string, updateGameDto: UpdateGameDto): Promise<Game> {
    if (!updateGameDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении игры',
        violations: [
          { field: 'title', message: 'Название не может быть пустым' },
        ],
      });
    }

    const game = await this.findOne(id);
    const updatedGame = {
      ...game,
      ...updateGameDto,
      completionDate: updateGameDto.completionDate
        ? new Date(updateGameDto.completionDate)
        : game.completionDate,
    };
    return this.gamesRepository.save(updatedGame);
  }

  async remove(id: string): Promise<void> {
    const result = await this.gamesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Игра с ID ${id} не найдена`);
    }
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
}
