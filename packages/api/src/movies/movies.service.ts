import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import * as fs from 'fs';
import * as path from 'path';
import { isUuid } from '../common/utils/uuid.util';
import { Director } from '../directors/entities/director.entity';

@Injectable()
export class MoviesService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'movies');

  constructor(
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
    @InjectRepository(Director)
    private directorsRepository: Repository<Director>,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async create(
    createMovieDto: CreateMovieDto,
    poster?: Express.Multer.File,
  ): Promise<Movie> {
    if (!createMovieDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании фильма',
        violations: [{ field: 'title', message: 'Название обязательно' }],
      });
    }

    const { directorIds, ...movieDto } = createMovieDto;
    const directors = await this.getDirectorsByIds(directorIds);

    let posterPath: string | null = null;

    if (poster) {
      const fileName = `${Date.now()}-${poster.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, poster.buffer);
      posterPath = `/uploads/movies/${fileName}`;
    }

    const movie = this.moviesRepository.create({
      ...movieDto,
      watchedAt: movieDto.watchedAt ? new Date(movieDto.watchedAt) : null,
      poster: posterPath,
      directors,
    });

    const savedMovie = await this.moviesRepository.save(movie);
    return this.findOne(savedMovie.id);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    directorId?: string,
    limit?: string,
  ): Promise<Movie[]> {
    const queryBuilder = this.moviesRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.directors', 'directors')
      .distinct(true);

    if (directorId) {
      queryBuilder.innerJoin(
        'movie.directors',
        'directorFilter',
        'directorFilter.id = :directorId',
        { directorId },
      );
    }

    if (sortBy) {
      const validSortFields = [
        'title',
        'genre',
        'rating',
        'watchedAt',
        'releaseYear',
        'createdAt',
      ];
      if (validSortFields.includes(sortBy)) {
        if (sortBy === 'rating') {
          // For rating sorting, handle null values properly
          if (sortOrder === 'DESC') {
            queryBuilder
              .orderBy('movie.rating IS NULL', 'ASC') // NULL values last
              .addOrderBy('movie.rating', 'DESC');
          } else {
            queryBuilder
              .orderBy('movie.rating IS NULL', 'ASC') // NULL values first
              .addOrderBy('movie.rating', 'ASC');
          }
        } else {
          queryBuilder.orderBy(`movie.${sortBy}`, sortOrder || 'ASC');
        }
      }
    } else {
      // Default sorting
      queryBuilder.orderBy('movie.watchedAt', 'DESC');
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        queryBuilder.limit(limitNum);
      }
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Movie> {
    if (!isUuid(id)) {
      throw new NotFoundException(`Фильм с ID ${id} не найден`);
    }

    const movie = await this.moviesRepository.findOne({
      where: { id },
      relations: ['directors'],
    });
    if (!movie) {
      throw new NotFoundException(`Фильм с ID ${id} не найден`);
    }
    return movie;
  }

  async update(
    id: string,
    updateMovieDto: UpdateMovieDto,
    poster?: Express.Multer.File,
  ): Promise<Movie> {
    if (updateMovieDto.title !== undefined && !updateMovieDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении фильма',
        violations: [
          { field: 'title', message: 'Название не может быть пустым' },
        ],
      });
    }

    const movie = await this.findOne(id);
    const { removePoster, directorIds, ...movieDto } = updateMovieDto;
    const directors =
      directorIds !== undefined
        ? await this.getDirectorsByIds(directorIds)
        : undefined;

    // Удаление текущего постера если есть флаг removePoster или новый постер
    if (movie.poster && (removePoster || poster)) {
      const oldPosterPath = path.join(process.cwd(), movie.poster);
      if (fs.existsSync(oldPosterPath)) {
        fs.unlinkSync(oldPosterPath);
      }
      movie.poster = null;
    }

    // Сохранение нового постера если есть
    if (poster) {
      const fileName = `${Date.now()}-${poster.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, poster.buffer);
      movie.poster = `/uploads/movies/${fileName}`;
    }

    const updatedMovie = this.moviesRepository.merge(movie, {
      ...movieDto,
      watchedAt: movieDto.watchedAt ? new Date(movieDto.watchedAt) : movie.watchedAt,
      poster: movie.poster,
      updatedAt: new Date(),
      ...(directors !== undefined ? { directors } : {}),
    });

    const savedMovie = await this.moviesRepository.save(updatedMovie);
    if (directors !== undefined) {
      const targetDirectorIds = directors.map((director) => director.id);
      const movieWithRelations = await this.findOne(savedMovie.id);
      const currentDirectorIds = movieWithRelations.directors?.map((director) => {
        return director.id;
      }) || [];

      const directorIdsToRemove = currentDirectorIds.filter((directorId) => {
        return !targetDirectorIds.includes(directorId);
      });
      if (directorIdsToRemove.length > 0) {
        await this.moviesRepository
          .createQueryBuilder()
          .relation(Movie, 'directors')
          .of(savedMovie.id)
          .remove(directorIdsToRemove);
      }
      const directorIdsToAdd = targetDirectorIds.filter((directorId) => {
        return !currentDirectorIds.includes(directorId);
      });
      if (directorIdsToAdd.length > 0) {
        await this.moviesRepository
          .createQueryBuilder()
          .relation(Movie, 'directors')
          .of(savedMovie.id)
          .add(directorIdsToAdd);
      }
    }
    return this.findOne(savedMovie.id);
  }

  async remove(id: string): Promise<void> {
    const movie = await this.findOne(id);

    if (movie.poster) {
      const posterPath = path.join(process.cwd(), movie.poster);
      if (fs.existsSync(posterPath)) {
        fs.unlinkSync(posterPath);
      }
    }

    await this.moviesRepository.delete(id);
  }

  private async getDirectorsByIds(directorIds?: string[]): Promise<Director[]> {
    if (!directorIds || directorIds.length === 0) {
      return [];
    }

    const directors = await this.directorsRepository.findBy({
      id: In(directorIds),
    });
    if (directors.length !== directorIds.length) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обработке режиссёров фильма',
        violations: [
          {
            field: 'directorIds',
            message: 'Один или несколько режиссёров не найдены',
          },
        ],
      });
    }

    return directorIds
      .map((directorId) => {
        return directors.find((director) => director.id === directorId);
      })
      .filter((director): director is Director => director !== undefined);
  }

  async getStats(): Promise<{
    total: number;
    thisMonth: number;
    avgRating: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, thisMonth, avgRatingResult]: [
      number,
      number,
      { avgRating?: string } | undefined,
    ] = await Promise.all([
      this.moviesRepository.count(),
      this.moviesRepository.count({
        where: {
          watchedAt: MoreThanOrEqual(startOfMonth),
        },
      }),
      this.moviesRepository
        .createQueryBuilder('movie')
        .select('AVG(movie.rating)', 'avgRating')
        .where('movie.rating IS NOT NULL')
        .getRawOne<{ avgRating?: string }>(),
    ]);

    return {
      total,
      thisMonth,
      avgRating: avgRatingResult?.avgRating
        ? parseFloat(avgRatingResult.avgRating)
        : 0,
    };
  }
}
