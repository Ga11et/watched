import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectorsService } from './directors.service';
import { DirectorsController } from './directors.controller';
import { Director } from './entities/director.entity';
import { Movie } from '../movies/entities/movie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Director, Movie])],
  controllers: [DirectorsController],
  providers: [DirectorsService],
})
export class DirectorsModule {}
