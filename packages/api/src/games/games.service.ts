import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  async findAll(): Promise<Game[]> {
    return this.gamesRepository.find();
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
}
