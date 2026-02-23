import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Developer } from './entities/developer.entity';
import { DevelopersService } from './developers.service';
import { DevelopersController } from './developers.controller';
import { Game } from '../games/entities/game.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Developer, Game])],
  controllers: [DevelopersController],
  providers: [DevelopersService],
  exports: [DevelopersService],
})
export class DevelopersModule {}
