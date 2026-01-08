import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MoviesService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'movies');

  constructor(
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
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

    let posterPath: string | null = null;

    if (poster) {
      const fileName = `${Date.now()}-${poster.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, poster.buffer);
      posterPath = `/uploads/movies/${fileName}`;
    }

    const movie = this.moviesRepository.create({
      ...createMovieDto,
      watchedAt: createMovieDto.watchedAt
        ? new Date(createMovieDto.watchedAt)
        : null,
      poster: posterPath,
    });

    return this.moviesRepository.save(movie);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    directorId?: string,
  ): Promise<Movie[]> {
    const queryBuilder = this.moviesRepository.createQueryBuilder('movie');

    if (directorId) {
      queryBuilder.where('movie.directorId = :directorId', { directorId });
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
        queryBuilder.orderBy(`movie.${sortBy}`, sortOrder || 'ASC');
      }
    } else {
      queryBuilder.orderBy('movie.watchedAt', 'DESC');
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.moviesRepository.findOne({ where: { id } });
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

    // Удаление текущего постера если есть флаг removePoster или новый постер
    if (movie.poster && (updateMovieDto.removePoster || poster)) {
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

    const updatedMovie = {
      ...movie,
      ...updateMovieDto,
      watchedAt: updateMovieDto.watchedAt
        ? new Date(updateMovieDto.watchedAt)
        : movie.watchedAt,
      poster: movie.poster,
      updatedAt: new Date(),
    };

    return this.moviesRepository.save(updatedMovie);
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
}
