import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publisher } from './entities/publisher.entity';
import { PublishersService } from './publishers.service';
import { PublishersController } from './publishers.controller';
import { Game } from '../games/entities/game.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Publisher, Game])],
  controllers: [PublishersController],
  providers: [PublishersService],
  exports: [PublishersService],
})
export class PublishersModule {}
