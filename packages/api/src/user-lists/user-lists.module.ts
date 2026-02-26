import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserListsController } from './user-lists.controller';
import { UserListsService } from './user-lists.service';
import { RolesGuard } from '../auth/roles.guard';
import { UserBook } from './entities/user-book.entity';
import { UserMovie } from './entities/user-movie.entity';
import { UserSeries } from './entities/user-series.entity';
import { UserGame } from './entities/user-game.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserBook, UserMovie, UserSeries, UserGame]),
  ],
  controllers: [UserListsController],
  providers: [UserListsService, RolesGuard],
})
export class UserListsModule {}
