import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { Game } from './entities/game.entity';
import { Publisher } from '../publishers/entities/publisher.entity';
import { Developer } from '../developers/entities/developer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Game, Publisher, Developer])],
  controllers: [GamesController],
  providers: [GamesService],
})
export class GamesModule {}
