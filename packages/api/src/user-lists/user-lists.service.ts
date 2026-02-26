import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user.entity';
import { UserBook } from './entities/user-book.entity';
import { UserMovie } from './entities/user-movie.entity';
import { UserSeries } from './entities/user-series.entity';
import { UserGame } from './entities/user-game.entity';
import {
  CreateUserBookDto,
  CreateUserGameDto,
  CreateUserMovieDto,
  CreateUserSeriesDto,
  UpdateUserBookDto,
  UpdateUserGameDto,
  UpdateUserMovieDto,
  UpdateUserSeriesDto,
} from './dto/user-list.dto';

export interface Actor {
  id: string;
  role: UserRole;
}

@Injectable()
export class UserListsService {
  constructor(
    @InjectRepository(UserBook)
    private readonly userBooksRepository: Repository<UserBook>,
    @InjectRepository(UserMovie)
    private readonly userMoviesRepository: Repository<UserMovie>,
    @InjectRepository(UserSeries)
    private readonly userSeriesRepository: Repository<UserSeries>,
    @InjectRepository(UserGame)
    private readonly userGamesRepository: Repository<UserGame>,
  ) {}

  getCurrentUserBooks(userId: string): Promise<UserBook[]> {
    return this.userBooksRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createCurrentUserBook(
    actor: Actor,
    dto: CreateUserBookDto,
  ): Promise<UserBook> {
    this.ensureCanMutate(actor);

    const entity = this.userBooksRepository.create({
      userId: actor.id,
      bookId: dto.bookId,
      rating: dto.rating ?? null,
      readAt: dto.readAt ? `${Date.parse(dto.readAt)}` : null,
      comment: dto.comment ?? null,
    });

    return this.userBooksRepository.save(entity);
  }

  async updateCurrentUserBook(
    id: string,
    actor: Actor,
    dto: UpdateUserBookDto,
  ): Promise<UserBook> {
    this.ensureCanMutate(actor);

    const entity = await this.userBooksRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    this.ensureCanAccessResource(actor, entity.userId);

    if (dto.rating !== undefined) {
      entity.rating = dto.rating;
    }
    if (dto.readAt !== undefined) {
      entity.readAt = dto.readAt ? `${Date.parse(dto.readAt)}` : null;
    }
    if (dto.comment !== undefined) {
      entity.comment = dto.comment;
    }

    return this.userBooksRepository.save(entity);
  }

  async removeCurrentUserBook(
    id: string,
    actor: Actor,
  ): Promise<{ id: string }> {
    this.ensureCanMutate(actor);

    const entity = await this.userBooksRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    this.ensureCanAccessResource(actor, entity.userId);

    await this.userBooksRepository.delete(id);

    return { id };
  }

  getCurrentUserMovies(userId: string): Promise<UserMovie[]> {
    return this.userMoviesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createCurrentUserMovie(
    actor: Actor,
    dto: CreateUserMovieDto,
  ): Promise<UserMovie> {
    this.ensureCanMutate(actor);

    const entity = this.userMoviesRepository.create({
      userId: actor.id,
      movieId: dto.movieId,
      rating: dto.rating ?? null,
      watchedAt: dto.watchedAt ? `${Date.parse(dto.watchedAt)}` : null,
      comment: dto.comment ?? null,
    });

    return this.userMoviesRepository.save(entity);
  }

  async updateCurrentUserMovie(
    id: string,
    actor: Actor,
    dto: UpdateUserMovieDto,
  ): Promise<UserMovie> {
    this.ensureCanMutate(actor);

    const entity = await this.userMoviesRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    this.ensureCanAccessResource(actor, entity.userId);

    if (dto.rating !== undefined) {
      entity.rating = dto.rating;
    }
    if (dto.watchedAt !== undefined) {
      entity.watchedAt = dto.watchedAt ? `${Date.parse(dto.watchedAt)}` : null;
    }
    if (dto.comment !== undefined) {
      entity.comment = dto.comment;
    }

    return this.userMoviesRepository.save(entity);
  }

  async removeCurrentUserMovie(
    id: string,
    actor: Actor,
  ): Promise<{ id: string }> {
    this.ensureCanMutate(actor);

    const entity = await this.userMoviesRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    this.ensureCanAccessResource(actor, entity.userId);

    await this.userMoviesRepository.delete(id);

    return { id };
  }

  getCurrentUserSeries(userId: string): Promise<UserSeries[]> {
    return this.userSeriesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createCurrentUserSeries(
    actor: Actor,
    dto: CreateUserSeriesDto,
  ): Promise<UserSeries> {
    this.ensureCanMutate(actor);

    const entity = this.userSeriesRepository.create({
      userId: actor.id,
      seriesId: dto.seriesId,
      rating: dto.rating ?? null,
      watchedAt: dto.watchedAt ? `${Date.parse(dto.watchedAt)}` : null,
      seasonsWatched: dto.seasonsWatched ?? null,
      comment: dto.comment ?? null,
    });

    return this.userSeriesRepository.save(entity);
  }

  async updateCurrentUserSeries(
    id: string,
    actor: Actor,
    dto: UpdateUserSeriesDto,
  ): Promise<UserSeries> {
    this.ensureCanMutate(actor);

    const entity = await this.userSeriesRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    this.ensureCanAccessResource(actor, entity.userId);

    if (dto.rating !== undefined) {
      entity.rating = dto.rating;
    }
    if (dto.watchedAt !== undefined) {
      entity.watchedAt = dto.watchedAt ? `${Date.parse(dto.watchedAt)}` : null;
    }
    if (dto.seasonsWatched !== undefined) {
      entity.seasonsWatched = dto.seasonsWatched;
    }
    if (dto.comment !== undefined) {
      entity.comment = dto.comment;
    }

    return this.userSeriesRepository.save(entity);
  }

  async removeCurrentUserSeries(
    id: string,
    actor: Actor,
  ): Promise<{ id: string }> {
    this.ensureCanMutate(actor);

    const entity = await this.userSeriesRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    this.ensureCanAccessResource(actor, entity.userId);

    await this.userSeriesRepository.delete(id);

    return { id };
  }

  getCurrentUserGames(userId: string): Promise<UserGame[]> {
    return this.userGamesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async createCurrentUserGame(
    actor: Actor,
    dto: CreateUserGameDto,
  ): Promise<UserGame> {
    this.ensureCanMutate(actor);

    const entity = this.userGamesRepository.create({
      userId: actor.id,
      gameId: dto.gameId,
      rating: dto.rating ?? null,
      playedHours: dto.playedHours ?? null,
      playedAt: dto.playedAt ? `${Date.parse(dto.playedAt)}` : null,
      comment: dto.comment ?? null,
    });

    return this.userGamesRepository.save(entity);
  }

  async updateCurrentUserGame(
    id: string,
    actor: Actor,
    dto: UpdateUserGameDto,
  ): Promise<UserGame> {
    this.ensureCanMutate(actor);

    const entity = await this.userGamesRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    this.ensureCanAccessResource(actor, entity.userId);

    if (dto.rating !== undefined) {
      entity.rating = dto.rating;
    }
    if (dto.playedHours !== undefined) {
      entity.playedHours = dto.playedHours;
    }
    if (dto.playedAt !== undefined) {
      entity.playedAt = dto.playedAt ? `${Date.parse(dto.playedAt)}` : null;
    }
    if (dto.comment !== undefined) {
      entity.comment = dto.comment;
    }

    return this.userGamesRepository.save(entity);
  }

  async removeCurrentUserGame(
    id: string,
    actor: Actor,
  ): Promise<{ id: string }> {
    this.ensureCanMutate(actor);

    const entity = await this.userGamesRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException('Record not found');
    }

    this.ensureCanAccessResource(actor, entity.userId);

    await this.userGamesRepository.delete(id);

    return { id };
  }

  getUserBooksByGuid(guid: string): Promise<UserBook[]> {
    return this.userBooksRepository.find({ where: { userId: guid } });
  }

  getUserMoviesByGuid(guid: string): Promise<UserMovie[]> {
    return this.userMoviesRepository.find({ where: { userId: guid } });
  }

  getUserSeriesByGuid(guid: string): Promise<UserSeries[]> {
    return this.userSeriesRepository.find({ where: { userId: guid } });
  }

  getUserGamesByGuid(guid: string): Promise<UserGame[]> {
    return this.userGamesRepository.find({ where: { userId: guid } });
  }

  private ensureCanMutate(actor: Actor): void {
    if (actor.role === UserRole.GUEST) {
      throw new ForbiddenException('Access denied');
    }
  }

  private ensureCanAccessResource(actor: Actor, resourceUserId: string): void {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    if (actor.role === UserRole.USER && actor.id === resourceUserId) {
      return;
    }

    throw new ForbiddenException('Access denied');
  }
}
