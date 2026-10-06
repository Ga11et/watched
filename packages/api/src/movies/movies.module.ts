import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { Movie } from './entities/movie.entity';
import { Director } from '../directors/entities/director.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movie, Director])],
  controllers: [MoviesController],
  providers: [MoviesService],
})
export class MoviesModule {}
