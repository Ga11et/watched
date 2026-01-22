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
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BooksService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'books');

  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async create(
    createBookDto: CreateBookDto,
    cover?: Express.Multer.File,
  ): Promise<Book> {
    if (!createBookDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании книги',
        violations: [{ field: 'title', message: 'Название обязательно' }],
      });
    }

    let coverPath: string | null = null;

    if (cover) {
      const fileName = `${Date.now()}-${cover.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, cover.buffer);
      coverPath = `/uploads/books/${fileName}`;
    }

    const book = this.booksRepository.create({
      ...createBookDto,
      cover: coverPath,
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
        'author.fullName',
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
        } else if (sortBy === 'author.fullName') {
          queryBuilder.orderBy('author.fullName', sortOrder || 'ASC');
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
    const book = await this.booksRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.author', 'author')
      .where('book.id = :id', { id })
      .getOne();

    if (!book) {
      throw new NotFoundException(`Книга с ID ${id} не найдена`);
    }
    return book;
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
    cover?: Express.Multer.File,
  ): Promise<Book> {
    if (updateBookDto.title !== undefined && !updateBookDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении книги',
        violations: [
          { field: 'title', message: 'Название не может быть пустым' },
        ],
      });
    }

    // Валидация рейтинга
    if (updateBookDto.rating !== undefined) {
      const rating =
        typeof updateBookDto.rating === 'string'
          ? parseFloat(updateBookDto.rating)
          : updateBookDto.rating;

      if (isNaN(rating)) {
        throw new UnprocessableEntityException({
          message: 'Произошла ошибка при обновлении книги',
          violations: [
            {
              field: 'rating',
              message: 'rating must be a number or a numeric string',
            },
          ],
        });
      }

      if (rating < 0) {
        throw new UnprocessableEntityException({
          message: 'Произошла ошибка при обновлении книги',
          violations: [
            { field: 'rating', message: 'rating must not be less than 0' },
          ],
        });
      }

      if (rating > 100) {
        throw new UnprocessableEntityException({
          message: 'Произошла ошибка при обновлении книги',
          violations: [
            { field: 'rating', message: 'rating must not be greater than 100' },
          ],
        });
      }
    }

    const book = await this.findOne(id);

    // Удаление текущей обложки если есть флаг removeCover или новая обложка
    if (book.cover && (updateBookDto.removeCover || cover)) {
      const oldCoverPath = path.join(process.cwd(), book.cover);
      if (fs.existsSync(oldCoverPath)) {
        fs.unlinkSync(oldCoverPath);
      }
      book.cover = null;
    }

    // Сохранение новой обложки если есть
    if (cover) {
      const fileName = `${Date.now()}-${cover.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, cover.buffer);
      book.cover = `/uploads/books/${fileName}`;
    }

    const updatedBook: Book = {
      id: book.id,
      title: updateBookDto.title ?? book.title,
      genre: updateBookDto.genre ?? book.genre,
      rating:
        updateBookDto.rating !== undefined
          ? typeof updateBookDto.rating === 'string'
            ? parseFloat(updateBookDto.rating)
            : updateBookDto.rating
          : book.rating,
      readAt: updateBookDto.readAt
        ? new Date(updateBookDto.readAt)
        : book.readAt,
      pageCount: updateBookDto.pageCount
        ? typeof updateBookDto.pageCount === 'string'
          ? parseInt(updateBookDto.pageCount)
          : updateBookDto.pageCount
        : book.pageCount,
      comment: updateBookDto.comment ?? book.comment,
      publishYear: updateBookDto.publishYear
        ? typeof updateBookDto.publishYear === 'string'
          ? parseInt(updateBookDto.publishYear)
          : updateBookDto.publishYear
        : book.publishYear,
      cover: book.cover,
      authorId: updateBookDto.authorId ?? book.authorId,
      author: book.author,
      createdAt: book.createdAt,
      updatedAt: new Date(),
    };

    return this.booksRepository.save(updatedBook);
  }

  async remove(id: string): Promise<void> {
    const book = await this.findOne(id);

    if (book.cover) {
      const coverPath = path.join(process.cwd(), book.cover);
      if (fs.existsSync(coverPath)) {
        fs.unlinkSync(coverPath);
      }
    }

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
