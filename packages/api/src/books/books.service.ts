import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
  ) {}

  async create(createBookDto: CreateBookDto): Promise<Book> {
    if (!createBookDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании книги',
        violations: [{ field: 'title', message: 'Название обязательно' }],
      });
    }

    const book = this.booksRepository.create({
      ...createBookDto,
      readAt: createBookDto.readAt ? new Date(createBookDto.readAt) : null,
    });

    return this.booksRepository.save(book);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    authorId?: string,
    limit?: string,
  ): Promise<Book[]> {
    const queryBuilder = this.booksRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author');

    if (authorId) {
      queryBuilder.where('book.authorId = :authorId', { authorId });
    }

    if (sortBy) {
      const validSortFields = [
        'title',
        'genre',
        'rating',
        'readAt',
        'publishYear',
        'createdAt',
        'author.name',
      ];
      if (validSortFields.includes(sortBy)) {
        if (sortBy === 'rating') {
          if (sortOrder === 'DESC') {
            queryBuilder
              .orderBy('book.rating IS NULL', 'ASC')
              .addOrderBy('book.rating', 'DESC');
          } else {
            queryBuilder
              .orderBy('book.rating IS NULL', 'ASC')
              .addOrderBy('book.rating', 'ASC');
          }
        } else if (sortBy === 'author.name') {
          queryBuilder.orderBy('author.name', sortOrder || 'ASC');
        } else {
          queryBuilder.orderBy(`book.${sortBy}`, sortOrder || 'ASC');
        }
      }
    } else {
      queryBuilder.orderBy('book.readAt', 'DESC');
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        queryBuilder.limit(limitNum);
      }
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.booksRepository.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Книга с ID ${id} не найдена`);
    }
    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
    if (updateBookDto.title !== undefined && !updateBookDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении книги',
        violations: [
          { field: 'title', message: 'Название не может быть пустым' },
        ],
      });
    }

    const book = await this.findOne(id);

    const updatedBook = {
      ...book,
      ...updateBookDto,
      readAt: updateBookDto.readAt
        ? new Date(updateBookDto.readAt)
        : book.readAt,
      updatedAt: new Date(),
    };

    return this.booksRepository.save(updatedBook);
  }

  async remove(id: string): Promise<void> {
    await this.booksRepository.delete(id);
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
      this.booksRepository.count(),
      this.booksRepository.count({
        where: {
          readAt: MoreThanOrEqual(startOfMonth),
        },
      }),
      this.booksRepository
        .createQueryBuilder('book')
        .select('AVG(book.rating)', 'avgRating')
        .where('book.rating IS NOT NULL')
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
