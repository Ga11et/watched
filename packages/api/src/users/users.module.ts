import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserBook } from '../user-lists/entities/user-book.entity';
import { UserMovie } from '../user-lists/entities/user-movie.entity';
import { UserSeries } from '../user-lists/entities/user-series.entity';
import { UserGame } from '../user-lists/entities/user-game.entity';
import { Movie } from '../movies/entities/movie.entity';
import { Director } from '../directors/entities/director.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserBook,
      UserMovie,
      UserSeries,
      UserGame,
      Movie,
      Director,
    ]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
