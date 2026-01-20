# Шаблоны кода для модуля авторов

## Entity (entities/author.entity.ts)

```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm'
import { Book } from '../../books/entities/book.entity'

/**
 * Сущность автора в системе отслеживания прочитанного контента
 * @description Основная модель для хранения информации об авторах книг
 */
@Entity()
export class Author {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /** Имя автора (обязательное поле) */
  @Column()
  name: string

  /** Биография автора (опционально) */
  @Column({ nullable: true, type: 'text' })
  bio: string | null

  /** Год рождения автора (опционально) */
  @Column({ nullable: true, type: 'int' })
  birthYear: number | null

  /** Год смерти автора (опционально) */
  @Column({ nullable: true, type: 'int' })
  deathYear: number | null

  /** Страна автора (опционально) */
  @Column({ nullable: true, type: 'text' })
  country: string | null

  /** URL фотографии автора (опционально) */
  @Column({ nullable: true, type: 'text' })
  photo: string | null

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date

  /** Связь с книгами автора */
  @OneToMany(() => Book, (book) => book.author)
  books: Book[]
}
```

## DTO (dto/create-author.dto.ts)

```typescript
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator'

/**
 * DTO для создания нового автора
 * @description Используется для валидации данных при создании автора через API
 * @endpoint POST /authors
 */
export class CreateAuthorDto {
  /**
   * Имя автора (обязательное поле)
   * @example "Лев Толстой"
   */
  @IsString()
  name: string

  /**
   * Биография автора (опционально)
   * @example "Русский писатель, мыслитель и общественный деятель"
   */
  @IsString()
  @IsOptional()
  bio?: string

  /**
   * Год рождения автора (опционально)
   * @min 1000
   * @max 2000
   * @example 1828
   */
  @IsNumber()
  @Min(1000)
  @Max(2000)
  @IsOptional()
  birthYear?: number

  /**
   * Год смерти автора (опционально)
   * @min 1000
   * @max 2024
   * @example 1910
   */
  @IsNumber()
  @Min(1000)
  @Max(2024)
  @IsOptional()
  deathYear?: number

  /**
   * Страна автора (опционально)
   * @example "Россия"
   */
  @IsString()
  @IsOptional()
  country?: string

  /**
   * URL фотографии автора (опционально)
   * @example "https://example.com/photos/tolstoy.jpg"
   */
  @IsString()
  @IsOptional()
  photo?: string
}
```

## Service (authors.service.ts)

```typescript
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Author } from './entities/author.entity'
import { CreateAuthorDto } from './dto/create-author.dto'
import { UpdateAuthorDto } from './dto/update-author.dto'

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
      })
    }

    const author = this.authorsRepository.create(createAuthorDto)
    return this.authorsRepository.save(author)
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    country?: string,
    limit?: string,
  ): Promise<Author[]> {
    const queryBuilder = this.authorsRepository.createQueryBuilder('author')

    if (country) {
      queryBuilder.where('author.country ILIKE :country', { country: `%${country}%` })
    }

    if (sortBy) {
      const validSortFields = ['name', 'birthYear', 'deathYear', 'country', 'createdAt']
      if (validSortFields.includes(sortBy)) {
        queryBuilder.orderBy(`author.${sortBy}`, sortOrder || 'ASC')
      }
    } else {
      queryBuilder.orderBy('author.name', 'ASC')
    }

    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (!isNaN(limitNum) && limitNum > 0) {
        queryBuilder.limit(limitNum)
      }
    }

    return queryBuilder.getMany()
  }

  async findOne(id: string): Promise<Author> {
    const author = await this.authorsRepository.findOne({
      where: { id },
      relations: ['books'],
    })

    if (!author) {
      throw new NotFoundException(`Автор с ID ${id} не найден`)
    }
    return author
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<Author> {
    if (updateAuthorDto.name !== undefined && !updateAuthorDto.name?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении автора',
        violations: [{ field: 'name', message: 'Имя автора не может быть пустым' }],
      })
    }

    const author = await this.findOne(id)

    const updatedAuthor = {
      ...author,
      ...updateAuthorDto,
      updatedAt: new Date(),
    }

    return this.authorsRepository.save(updatedAuthor)
  }

  async remove(id: string): Promise<void> {
    const author = await this.findOne(id)
    await this.authorsRepository.delete(id)
  }

  async getStats(): Promise<{
    total: number
    byCountry: Record<string, number>
    avgAge: number
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
    ])

    const byCountry = countryStats.reduce((acc, stat) => {
      acc[stat.country] = parseInt(stat.count)
      return acc
    }, {})

    const currentYear = new Date().getFullYear()
    const avgAge = avgAgeResult?.avgBirthYear
      ? Math.round(currentYear - parseFloat(avgAgeResult.avgBirthYear))
      : 0

    return {
      total,
      byCountry,
      avgAge,
    }
  }

  async searchByName(query: string): Promise<Author[]> {
    return this.authorsRepository
      .createQueryBuilder('author')
      .where('author.name ILIKE :query', { query: `%${query}%` })
      .orderBy('author.name', 'ASC')
      .limit(10)
      .getMany()
  }
}
```

## Controller (authors.controller.ts)

```typescript
import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common'
import { AuthorsService } from './authors.service'
import { Author } from './entities/author.entity'
import { CreateAuthorDto } from './dto/create-author.dto'
import { UpdateAuthorDto } from './dto/update-author.dto'

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  create(@Body() createAuthorDto: CreateAuthorDto): Promise<Author> {
    return this.authorsService.create(createAuthorDto)
  }

  @Get('stats')
  getStats(): Promise<{
    total: number
    byCountry: Record<string, number>
    avgAge: number
  }> {
    return this.authorsService.getStats()
  }

  @Get('search')
  searchByName(@Query('q') query: string): Promise<Author[]> {
    return this.authorsService.searchByName(query)
  }

  @Get()
  findAll(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('country') country?: string,
    @Query('limit') limit?: string,
  ): Promise<Author[]> {
    return this.authorsService.findAll(sortBy, sortOrder, country, limit)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Author> {
    return this.authorsService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAuthorDto: UpdateAuthorDto): Promise<Author> {
    return this.authorsService.update(id, updateAuthorDto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.authorsService.remove(id)
  }
}
```

## Module (authors.module.ts)

```typescript
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthorsService } from './authors.service'
import { AuthorsController } from './authors.controller'
import { Author } from './entities/author.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Author])],
  controllers: [AuthorsController],
  providers: [AuthorsService],
  exports: [AuthorsService],
})
export class AuthorsModule {}
```

## Обновленная Entity Book (связь с автором)

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Author } from '../../authors/entities/author.entity'

@Entity()
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  // ... другие поля

  /**
   * Автор книги (внешний ключ)
   * @relation Связь с таблицей authors
   */
  @ManyToOne(() => Author, (author) => author.books, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: Author | null

  /**
   * ID автора (опционально)
   * @description Внешний ключ к таблице authors
   */
  @Column({ nullable: true, type: 'uuid' })
  authorId: string | null

  // ... timestamps
}
```

## Обновленный Books Module (импорт AuthorsModule)

```typescript
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BooksService } from './books.service'
import { BooksController } from './books.controller'
import { Book } from './entities/book.entity'
import { AuthorsModule } from '../authors/authors.module'

@Module({
  imports: [TypeOrmModule.forFeature([Book]), AuthorsModule],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
```

## SQL индексы для авторов

```sql
-- Индексы для таблицы authors
CREATE INDEX CONCURRENTLY idx_authors_name ON authors(name);
CREATE INDEX CONCURRENTLY idx_authors_country ON authors(country);
CREATE INDEX CONCURRENTLY idx_authors_birth_year ON authors(birth_year);

-- Индекс для связи книг и авторов
CREATE INDEX CONCURRENTLY idx_books_author_id ON books(author_id);
```

## Эндпоинты Authors API

```
POST   /authors              # Создать автора
GET    /authors              # Список авторов
GET    /authors/stats        # Статистика авторов
GET    /authors/search?q=    # Поиск авторов по имени
GET    /authors/:id          # Детали автора с книгами
PUT    /authors/:id          # Обновить автора
DELETE /authors/:id          # Удалить автора
```

## Пример использования связей

```typescript
// Получить автора с его книгами
const author = await authorsService.findOne(id)
console.log(author.books) // Массив книг автора

// Получить книги с авторами
const books = await booksService.findAll()
console.log(books[0].author) // Объект автора или null
```
