import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from './entities/author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private authorsRepository: Repository<Author>,
  ) {}

  async create(createAuthorDto: CreateAuthorDto): Promise<Author> {
    if (!createAuthorDto.name?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании автора',
        violations: [{ field: 'name', message: 'Имя автора обязательно' }],
      });
    }

    const author = this.authorsRepository.create(createAuthorDto);
    return this.authorsRepository.save(author);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    country?: string,
    limit?: string,
  ): Promise<Author[]> {
    const queryBuilder = this.authorsRepository.createQueryBuilder('author');

    if (country) {
      queryBuilder.where('author.country ILIKE :country', {
        country: `%${country}%`,
      });
    }

    if (sortBy) {
      const validSortFields = [
        'name',
        'birthYear',
        'deathYear',
        'country',
        'createdAt',
      ];
      if (validSortFields.includes(sortBy)) {
        queryBuilder.orderBy(`author.${sortBy}`, sortOrder || 'ASC');
      }
    } else {
      queryBuilder.orderBy('author.name', 'ASC');
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        queryBuilder.limit(limitNum);
      }
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Author> {
    const author = await this.authorsRepository.findOne({
      where: { id },
      relations: ['books'],
    });

    if (!author) {
      throw new NotFoundException(`Автор с ID ${id} не найден`);
    }
    return author;
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<Author> {
    if (updateAuthorDto.name !== undefined && !updateAuthorDto.name?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении автора',
        violations: [
          { field: 'name', message: 'Имя автора не может быть пустым' },
        ],
      });
    }

    const author = await this.findOne(id);

    const updatedAuthor = {
      ...author,
      ...updateAuthorDto,
      updatedAt: new Date(),
    };

    return this.authorsRepository.save(updatedAuthor);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.authorsRepository.delete(id);
  }

  async getStats(): Promise<{
    total: number;
    byCountry: Record<string, number>;
    avgAge: number;
  }> {
    const [total, countryStats, avgAgeResult] = await Promise.all([
      this.authorsRepository.count(),
      this.authorsRepository
        .createQueryBuilder('author')
        .select('author.country', 'country')
        .addSelect('COUNT(*)', 'count')
        .where('author.country IS NOT NULL')
        .groupBy('author.country')
        .getRawMany<{ country: string; count: string }>(),
      this.authorsRepository
        .createQueryBuilder('author')
        .select('AVG(author.birthYear)', 'avgBirthYear')
        .where('author.birthYear IS NOT NULL')
        .getRawOne<{ avgBirthYear?: string }>(),
    ]);

    const byCountry = countryStats.reduce((acc, stat) => {
      acc[stat.country] = parseInt(stat.count);
      return acc;
    }, {});

    const currentYear = new Date().getFullYear();
    const avgAge = avgAgeResult?.avgBirthYear
      ? Math.round(currentYear - parseFloat(avgAgeResult.avgBirthYear))
      : 0;

    return {
      total,
      byCountry,
      avgAge,
    };
  }

  async searchByName(query: string): Promise<Author[]> {
    return this.authorsRepository
      .createQueryBuilder('author')
      .where('author.name ILIKE :query', { query: `%${query}%` })
      .orderBy('author.name', 'ASC')
      .limit(10)
      .getMany();
  }
}
