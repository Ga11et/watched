import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Series } from './entities/series.entity';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeriesService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'series');

  constructor(
    @InjectRepository(Series)
    private seriesRepository: Repository<Series>,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async create(
    createSeriesDto: CreateSeriesDto,
    poster?: Express.Multer.File,
  ): Promise<Series> {
    if (!createSeriesDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании сериала',
        violations: [{ field: 'title', message: 'Название обязательно' }],
      });
    }

    // Валидация сезонов
    if (
      createSeriesDto.totalSeasons &&
      createSeriesDto.watchedSeasons &&
      createSeriesDto.watchedSeasons > createSeriesDto.totalSeasons
    ) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании сериала',
        violations: [
          {
            field: 'watchedSeasons',
            message:
              'Просмотренных сезонов не может быть больше общего количества',
          },
        ],
      });
    }

    let posterPath: string | null = null;

    if (poster) {
      const fileName = `${Date.now()}-${poster.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, poster.buffer);
      posterPath = `/uploads/series/${fileName}`;
    }

    const series = this.seriesRepository.create({
      ...createSeriesDto,
      watchedAt: createSeriesDto.watchedAt
        ? new Date(createSeriesDto.watchedAt)
        : null,
      poster: posterPath,
    });

    return this.seriesRepository.save(series);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ): Promise<Series[]> {
    const queryBuilder = this.seriesRepository.createQueryBuilder('series');

    if (sortBy) {
      const validSortFields = [
        'title',
        'rating',
        'country',
        'watchedAt',
        'totalSeasons',
        'watchedSeasons',
        'createdAt',
      ];
      if (validSortFields.includes(sortBy)) {
        if (sortBy === 'rating') {
          // For rating sorting, handle null values properly
          if (sortOrder === 'DESC') {
            queryBuilder
              .orderBy('series.rating IS NULL', 'ASC') // NULL values last
              .addOrderBy('series.rating', 'DESC');
          } else {
            queryBuilder
              .orderBy('series.rating IS NULL', 'ASC') // NULL values first
              .addOrderBy('series.rating', 'ASC');
          }
        } else {
          queryBuilder.orderBy(`series.${sortBy}`, sortOrder || 'ASC');
        }
      }
    } else {
      // Default sorting
      queryBuilder.orderBy('series.watchedAt', 'DESC');
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Series> {
    const series = await this.seriesRepository.findOne({ where: { id } });
    if (!series) {
      throw new NotFoundException(`Сериал с ID ${id} не найден`);
    }
    return series;
  }

  async update(
    id: string,
    updateSeriesDto: UpdateSeriesDto,
    poster?: Express.Multer.File,
  ): Promise<Series> {
    if (updateSeriesDto.title !== undefined && !updateSeriesDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении сериала',
        violations: [
          { field: 'title', message: 'Название не может быть пустым' },
        ],
      });
    }

    // Валидация сезонов
    if (
      updateSeriesDto.totalSeasons !== undefined &&
      updateSeriesDto.watchedSeasons !== undefined &&
      updateSeriesDto.watchedSeasons > updateSeriesDto.totalSeasons
    ) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении сериала',
        violations: [
          {
            field: 'watchedSeasons',
            message:
              'Просмотренных сезонов не может быть больше общего количества',
          },
        ],
      });
    }

    const series = await this.findOne(id);

    // Удаление текущего постера если есть флаг removePoster или новый постер
    if (series.poster && (updateSeriesDto.removePoster || poster)) {
      const oldPosterPath = path.join(process.cwd(), series.poster);
      if (fs.existsSync(oldPosterPath)) {
        fs.unlinkSync(oldPosterPath);
      }
      series.poster = null;
    }

    // Сохранение нового постера если есть
    if (poster) {
      const fileName = `${Date.now()}-${poster.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, poster.buffer);
      series.poster = `/uploads/series/${fileName}`;
    }

    const updatedSeries = {
      ...series,
      ...updateSeriesDto,
      watchedAt: updateSeriesDto.watchedAt
        ? new Date(updateSeriesDto.watchedAt)
        : series.watchedAt,
      poster: series.poster,
      updatedAt: new Date(),
    };

    return this.seriesRepository.save(updatedSeries);
  }

  async remove(id: string): Promise<void> {
    const series = await this.findOne(id);

    if (series.poster) {
      const posterPath = path.join(process.cwd(), series.poster);
      if (fs.existsSync(posterPath)) {
        fs.unlinkSync(posterPath);
      }
    }

    await this.seriesRepository.delete(id);
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
      this.seriesRepository.count(),
      this.seriesRepository.count({
        where: {
          watchedAt: MoreThanOrEqual(startOfMonth),
        },
      }),
      this.seriesRepository
        .createQueryBuilder('series')
        .select('AVG(series.rating)', 'avgRating')
        .where('series.rating IS NOT NULL')
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
