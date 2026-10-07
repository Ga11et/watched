import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, QueryFailedError, Repository } from 'typeorm';
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
import { Book } from '../books/entities/book.entity';
import { Author } from '../authors/entities/author.entity';
import { Movie } from '../movies/entities/movie.entity';
import * as fs from 'fs';
import * as path from 'path';

export interface Actor {
  id: string;
  role: UserRole;
}

type UserMovieResponse = Omit<UserMovie, 'movieId'>;

@Injectable()
export class UserListsService {
  private readonly booksUploadPath = path.join(
    process.cwd(),
    'uploads',
    'books',
  );

  constructor(
    @InjectRepository(UserBook)
    private readonly userBooksRepository: Repository<UserBook>,
    @InjectRepository(UserMovie)
    private readonly userMoviesRepository: Repository<UserMovie>,
    @InjectRepository(UserSeries)
    private readonly userSeriesRepository: Repository<UserSeries>,
    @InjectRepository(UserGame)
    private readonly userGamesRepository: Repository<UserGame>,
    @InjectRepository(Book)
    private readonly booksRepository: Repository<Book>,
    @InjectRepository(Author)
    private readonly authorsRepository: Repository<Author>,
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
  ) {
    if (!fs.existsSync(this.booksUploadPath)) {
      fs.mkdirSync(this.booksUploadPath, { recursive: true });
    }
  }

  getCurrentUserBooks(userId: string): Promise<UserBook[]> {
    return this.userBooksRepository.find({
      where: { userId },
      relations: { book: { authors: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async getCurrentUserBook(userId: string, id: string): Promise<UserBook> {
    const book = await this.userBooksRepository.findOne({
      where: { userId, id },
      relations: { book: { authors: true } },
    });

    if (!book) {
      throw new NotFoundException('UserBook not found');
    }
    return book;
  }

  async getUserBookStats(
    userId: string,
  ): Promise<{ total: number; thisMonth: number; avgRating: number | null }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, thisMonth, avgRatingResult]: [
      number,
      number,
      { avgRating: string | null }[],
    ] = await Promise.all([
      this.userBooksRepository.count({ where: { userId } }),
      this.userBooksRepository.count({
        where: { userId, readAt: MoreThanOrEqual(startOfMonth) },
      }),
      this.userBooksRepository
        .createQueryBuilder('ub')
        .select('AVG(ub.rating)', 'avgRating')
        .where('ub.userId = :userId', { userId })
        .andWhere('ub.rating IS NOT NULL')
        .getRawMany(),
    ]);

    const avg = avgRatingResult[0]?.avgRating;

    return {
      total,
      thisMonth,
      avgRating: avg != null ? Math.round(parseFloat(avg)) : null,
    };
  }

  async createCurrentUserBook(
    actor: Actor,
    dto: CreateUserBookDto,
    cover?: Express.Multer.File,
  ): Promise<UserBook> {
    this.ensureCanMutate(actor);

    let book = await this.booksRepository.findOne({
      where: { title: dto.title },
    });
    if (!book) {
      let coverPath: string | null = null;

      if (cover) {
        const fileName = `${Date.now()}-${cover.originalname}`;
        const filePath = path.join(this.booksUploadPath, fileName);
        fs.writeFileSync(filePath, cover.buffer);
        coverPath = `/uploads/books/${fileName}`;
      }

      const authors = await this.resolveAuthors(dto.authorIds);

      book = this.booksRepository.create({
        title: dto.title,
        genre: dto.genre,
        pageCount: dto.pageCount,
        publishYear: dto.publishYear,
        cover: coverPath,
        authors,
      });

      book = await this.booksRepository.save(book);
    }

    const entity = this.userBooksRepository.create({
      userId: actor.id,
      bookId: book.id,
      rating: dto.rating ?? null,
      readAt: dto.readAt ? new Date(dto.readAt) : null,
      comment: dto.comment ?? null,
    });

    const saved = await this.userBooksRepository.save(entity);

    return this.userBooksRepository.findOneOrFail({
      where: { id: saved.id },
      relations: { book: { authors: true } },
    });
  }

  private async resolveAuthors(authorIds?: string[]): Promise<Author[]> {
    if (!authorIds?.length) {
      return [];
    }

    const uniqueIds = [...new Set(authorIds)];
    const authors = await this.authorsRepository.findBy({ id: In(uniqueIds) });

    if (authors.length !== uniqueIds.length) {
      const foundIds = new Set(authors.map((a) => a.id));
      const missingIds = uniqueIds.filter((id) => !foundIds.has(id));

      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при сохранении книги',
        violations: [
          {
            field: 'authorIds',
            message: `Авторы не найдены: ${missingIds.join(', ')}`,
          },
        ],
      });
    }

    return authors;
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
      entity.readAt = dto.readAt ? new Date(dto.readAt) : null;
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

  async getCurrentUserMovies(userId: string): Promise<UserMovieResponse[]> {
    const records = await this.userMoviesRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return this.withCatalogMovies(records);
  }

  private async withCatalogMovies(
    records: UserMovie[],
  ): Promise<UserMovieResponse[]> {
    if (!records.length) {
      return [];
    }

    const movies = await this.moviesRepository.find({
      where: { id: In([...new Set(records.map((record) => record.movieId))]) },
      relations: { directors: true },
    });
    const moviesById = new Map(movies.map((movie) => [movie.id, movie]));

    return records.map(({ movieId, ...record }) => {
      const movie = moviesById.get(movieId);
      if (!movie) {
        throw new Error(
          `UserMovie ${record.id} references missing Movie ${movieId}`,
        );
      }
      return {
        ...record,
        movie: { ...movie, directors: movie.directors ?? [] },
      };
    });
  }

  async getUserMovieById(id: string): Promise<UserMovieResponse> {
    const movie = await this.userMoviesRepository.findOne({ where: { id } });

    if (!movie) {
      throw new NotFoundException('UserMovie not found');
    }

    const [record] = await this.withCatalogMovies([movie]);
    return record;
  }

  async getUserMovieStats(
    userId: string,
  ): Promise<{ total: number; thisMonth: number; avgRating: number | null }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, thisMonth, avgRatingResult]: [
      number,
      number,
      { avgRating: string | null }[],
    ] = await Promise.all([
      this.userMoviesRepository.count({ where: { userId } }),
      this.userMoviesRepository.count({
        where: { userId, watchedAt: MoreThanOrEqual(startOfMonth) },
      }),
      this.userMoviesRepository
        .createQueryBuilder('um')
        .select('AVG(um.rating)', 'avgRating')
        .where('um.userId = :userId', { userId })
        .andWhere('um.rating IS NOT NULL')
        .getRawMany(),
    ]);

    const avg = avgRatingResult[0]?.avgRating;

    return {
      total,
      thisMonth,
      avgRating: avg != null ? Math.round(parseFloat(avg)) : null,
    };
  }

  async createCurrentUserMovie(
    actor: Actor,
    dto: CreateUserMovieDto,
  ): Promise<UserMovieResponse> {
    this.ensureCanMutate(actor);

    const movies = await this.moviesRepository.find({
      where: { title: dto.title },
      take: 2,
    });
    if (!movies.length) {
      throw new NotFoundException('Movie not found');
    }
    if (movies.length > 1) {
      throw new ConflictException('Multiple movies have this exact title');
    }
    const [movie] = movies;

    const existing = await this.userMoviesRepository.findOne({
      where: { userId: actor.id, movieId: movie.id },
    });
    if (existing) {
      throw new ConflictException('UserMovie already exists');
    }

    const entity = this.userMoviesRepository.create({
      userId: actor.id,
      movieId: movie.id,
      rating: dto.rating ?? null,
      watchedAt: dto.watchedAt ? new Date(dto.watchedAt) : null,
      comment: dto.comment ?? null,
    });

    try {
      const saved = await this.userMoviesRepository.save(entity);
      return this.getUserMovieById(saved.id);
    } catch (error: unknown) {
      const message = 'Не удалось добавить фильм в пользовательский список';
      if (
        error instanceof QueryFailedError &&
        'code' in error &&
        error.code === '23505' &&
        'constraint' in error &&
        error.constraint === 'UQ_user_movies_user_movie'
      ) {
        throw new ConflictException('UserMovie already exists', { cause: error });
      }
      if (
        error instanceof QueryFailedError &&
        'code' in error &&
        error.code === '23503'
      ) {
        throw new NotFoundException(message, { cause: error });
      }
      throw new InternalServerErrorException(message, { cause: error });
    }
  }

  async updateCurrentUserMovie(
    id: string,
    actor: Actor,
    dto: UpdateUserMovieDto,
  ): Promise<UserMovieResponse> {
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
      entity.watchedAt = dto.watchedAt ? new Date(dto.watchedAt) : null;
    }
    if (dto.comment !== undefined) {
      entity.comment = dto.comment;
    }

    const saved = await this.userMoviesRepository.save(entity);
    return this.getUserMovieById(saved.id);
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
    return this.userBooksRepository.find({
      where: { userId: guid },
      relations: { book: true },
    });
  }

  async getUserMoviesByGuid(guid: string): Promise<UserMovieResponse[]> {
    const records = await this.userMoviesRepository.find({
      where: { userId: guid },
    });
    return this.withCatalogMovies(records);
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
