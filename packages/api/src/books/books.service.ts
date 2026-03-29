import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import * as fs from 'fs';
import * as path from 'path';
import { isUuid } from '../common/utils/uuid.util';
import { Author } from '../authors/entities/author.entity';

@Injectable()
export class BooksService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'books');

  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    @InjectRepository(Author)
    private authorsRepository: Repository<Author>,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  private async resolveAuthors(authorIds?: string[]): Promise<Author[]> {
    if (!authorIds?.length) {
      return [];
    }

    const uniqueAuthorIds = [...new Set(authorIds)];
    const authors = await this.authorsRepository.findBy({
      id: In(uniqueAuthorIds),
    });

    if (authors.length !== uniqueAuthorIds.length) {
      const foundIds = new Set(authors.map((author) => author.id));
      const missingIds = uniqueAuthorIds.filter((id) => !foundIds.has(id));

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

    const authors = await this.resolveAuthors(createBookDto.authorIds);

    const book = this.booksRepository.create({
      title: createBookDto.title,
      genre: createBookDto.genre ?? null,
      cover: coverPath,
      pageCount: createBookDto.pageCount ?? null,
      publishYear: createBookDto.publishYear ?? null,
      comment: createBookDto.comment ?? null,
      authors,
    });

    return this.booksRepository.save(book);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    authorId?: string,
    limit?: string,
    search?: string,
  ): Promise<Book[]> {
    const queryBuilder = this.booksRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.authors', 'authors');

    if (authorId) {
      queryBuilder.where('authors.id = :authorId', { authorId });
    }

    if (search?.trim()) {
      if (authorId) {
        queryBuilder.andWhere('book.title ILIKE :search', {
          search: `%${search.trim()}%`,
        });
      } else {
        queryBuilder.where('book.title ILIKE :search', {
          search: `%${search.trim()}%`,
        });
      }
    }

    if (sortBy) {
      const validSortFields = [
        'title',
        'genre',
        'publishYear',
        'createdAt',
        'authors.fullName',
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
        } else if (sortBy === 'authors.fullName') {
          queryBuilder.orderBy('authors.fullName', sortOrder || 'ASC');
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
    if (!isUuid(id)) {
      throw new NotFoundException(`Книга с ID ${id} не найдена`);
    }
    const book = await this.booksRepository.findOne({
      where: { id },
      relations: { authors: true },
    });

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

    const authors =
      updateBookDto.authorIds !== undefined
        ? await this.resolveAuthors(updateBookDto.authorIds)
        : book.authors;

    const updatedBook: Book = {
      id: book.id,
      title: updateBookDto.title ?? book.title,
      genre: updateBookDto.genre ?? book.genre,
      pageCount:
        updateBookDto.pageCount !== undefined
          ? typeof updateBookDto.pageCount === 'string'
            ? parseInt(updateBookDto.pageCount)
            : updateBookDto.pageCount
          : book.pageCount,
      publishYear:
        updateBookDto.publishYear !== undefined
          ? typeof updateBookDto.publishYear === 'string'
            ? parseInt(updateBookDto.publishYear)
            : updateBookDto.publishYear
          : book.publishYear,
      cover: book.cover,
      comment: book.comment,
      authors,
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
    const [total, thisMonth, avgRatingResult]: [
      number,
      number,
      { avgRating?: string } | undefined,
    ] = await Promise.all([
      this.booksRepository.count(),
      this.booksRepository.count(),
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
