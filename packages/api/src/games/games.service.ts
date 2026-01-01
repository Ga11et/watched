import { Injectable, NotFoundException } from '@nestjs/common';
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
    const game = this.gamesRepository.create({
      ...createGameDto,
      completionDate: new Date(createGameDto.completionDate),
    });
    return this.gamesRepository.save(game);
  }

  async findAll(): Promise<Game[]> {
    return this.gamesRepository.find();
  }

  async findOne(id: number): Promise<Game> {
    const game = await this.gamesRepository.findOne({ where: { id } });
    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
    return game;
  }

  async update(id: number, updateGameDto: UpdateGameDto): Promise<Game> {
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

  async remove(id: number): Promise<void> {
    const result = await this.gamesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }
  }
}
