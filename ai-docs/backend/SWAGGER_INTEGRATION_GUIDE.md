# Руководство по интеграции Swagger в NestJS проект

## Обзор

Swagger (OpenAPI 3.0) - стандарт для описания REST API. В NestJS он интегрируется через пакет `@nestjs/swagger` и автоматически генерирует интерактивную документацию.

## Преимущества

- 🚀 **Автоматическая генерация** из декораторов кода
- 🎨 **Интерактивный UI** для тестирования API
- 📖 **Актуальная документация** - всегда соответствует коду
- 🔒 **Поддержка авторизации** и ролевого доступа
- 📝 **TypeScript типизация** DTO схем
- 🌐 **Стандарт индустрии** OpenAPI 3.0

---

## Шаг 1: Установка пакетов

### **Базовые пакеты:**

```bash
npm install @nestjs/swagger swagger-ui-express
```

### **Дополнительные пакеты (опционально):**

```bash
# Для красивой темы
npm install swagger-ui-themes

# Для валидации схем
npm install class-validator class-transformer

# Для генерации Postman коллекций
npm install @apidevtools/swagger-parser
```

---

## Шаг 2: Базовая настройка

### **Обновление main.ts:**

```typescript
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Включение валидации DTO
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  // Swagger конфигурация
  const config = new DocumentBuilder()
    .setTitle('Watched API')
    .setDescription(
      `
      ## API для управления списками контента
      
      ### 🎯 Особенности:
      -  Гибридная структура данных (справочники + пользовательские списки)
      - 🎮 Поддержка книг, фильмов, сериалов, игр, авторов, режиссеров
      
      ### 🔑 Доступ:
      - **GET /books, /movies, /series, /games** - открыты для всех
      - **POST /books, /movies, /series, /games** - для контент-менеджеров
      - **POST /user-*** - для персональных списков
    `,
    )
    .setVersion('2.0')
    .addTag('books')
    .addTag('movies')
    .addTag('series')
    .addTag('games')
    .addTag('authors')
    .addTag('directors')
    .addTag('user-books')
    .addTag('user-movies')
    .addTag('user-series')
    .addTag('user-games')
    .addTag('user-authors')
    .addTag('user-directors')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6; }
      .swagger-ui .scheme-container { background: #f8fafc; }
    `,
    customSiteTitle: 'Watched API Documentation',
    customfavIcon: '/favicon.ico',
  })

  await app.listen(process.env.PORT ?? 33010)
  console.log(`🚀 Application running on: http://localhost:33010`)
  console.log(`📚 API Documentation: http://localhost:33010/api`)
}

bootstrap()
```

---

## Шаг 3: Декораторы для Entity

### **Book Entity:**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { Author } from '../../authors/entities/author.entity'

@Entity()
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ nullable: true, type: 'text' })
  genre: string | null

  @Column({ nullable: true, type: 'int' })
  rating: number | null

  @Column({ nullable: true, type: 'timestamp' })
  readAt: Date | null

  @Column({ nullable: true, type: 'int' })
  pageCount: number | null

  @Column({ nullable: true, type: 'text' })
  comment: string | null

  @Column({ nullable: true, type: 'int' })
  publishYear: number | null

  @Column({ nullable: true, type: 'text' })
  cover: string | null

  @ManyToOne(() => Author, (author) => author.books, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: Author | null

  @Column({ nullable: true, type: 'uuid' })
  authorId: string | null

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date
}
```

---

## Шаг 4: DTO с декораторами

### **CreateBookDto:**

```typescript
import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator'

export class CreateBookDto {
  @IsString()
  title: string

  @IsUUID()
  @IsOptional()
  authorId?: string

  @IsString()
  @IsOptional()
  genre?: string

  @IsOptional()
  rating?: number

  @IsDateString()
  @IsOptional()
  readAt?: string

  @IsOptional()
  publishYear?: number

  @IsOptional()
  pageCount?: number

  @IsString()
  @IsOptional()
  comment?: string

  @IsString()
  @IsOptional()
  cover?: string
}
```

---

## Шаг 5: Контроллеры с декораторами

### **BooksController:**

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { BooksService } from './books.service'
import { Book } from './entities/book.entity'
import { CreateBookDto } from './dto/create-book.dto'
import { UpdateBookDto } from './dto/update-book.dto'

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseInterceptors(FileInterceptor('cover'))
  create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() cover?: Express.Multer.File,
  ): Promise<Book> {
    return this.booksService.create(createBookDto, cover)
  }

  @Get('stats')
  getStats(): Promise<{
    total: number
    thisMonth: number
    avgRating: number
  }> {
    return this.booksService.getStats()
  }

  @Get()
  findAll(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('authorId') authorId?: string,
    @Query('limit') limit?: string,
  ): Promise<Book[]> {
    return this.booksService.findAll(sortBy, sortOrder, authorId, limit)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Book> {
    return this.booksService.findOne(id)
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('cover'))
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFile() cover?: Express.Multer.File,
  ): Promise<Book> {
    return this.booksService.update(id, updateBookDto, cover)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.booksService.remove(id)
  }
}
```

---

## Шаг 6: Добавление Swagger декораторов

Теперь добавим Swagger декораторы к существующему коду для автоматической генерации документации:

### **Book Entity с декораторами:**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Author } from '../../authors/entities/author.entity'

@Entity()
export class Book {
  @ApiProperty({
    description: 'Уникальный идентификатор книги',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string

  @ApiProperty({
    description: 'Название книги',
    example: 'Война и мир',
  })
  @Column()
  title: string

  @ApiPropertyOptional({
    description: 'Жанр книги',
    example: 'Роман, Исторический роман',
  })
  @Column({ nullable: true, type: 'text' })
  genre: string | null

  @ApiPropertyOptional({
    description: 'Рейтинг книги от 0 до 100',
    example: 95,
  })
  @Column({ nullable: true, type: 'int' })
  rating: number | null

  @ApiPropertyOptional({
    description: 'Дата прочтения книги',
    example: '2024-01-15T00:00:00.000Z',
  })
  @Column({ nullable: true, type: 'timestamp' })
  readAt: Date | null

  @ApiPropertyOptional({
    description: 'Количество страниц',
    example: 1225,
  })
  @Column({ nullable: true, type: 'int' })
  pageCount: number | null

  @ApiPropertyOptional({
    description: 'Комментарий к книге',
    example: 'Величайшее произведение русской литературы',
  })
  @Column({ nullable: true, type: 'text' })
  comment: string | null

  @ApiPropertyOptional({
    description: 'Год издания',
    example: 1869,
  })
  @Column({ nullable: true, type: 'int' })
  publishYear: number | null

  @ApiPropertyOptional({
    description: 'Обложка книги',
    example: '/uploads/books/1640995200000-cover.jpg',
  })
  @Column({ nullable: true, type: 'text' })
  cover: string | null

  @ApiPropertyOptional({
    description: 'Автор книги',
    type: () => Author,
  })
  @ManyToOne(() => Author, (author) => author.books, { nullable: true })
  @JoinColumn({ name: 'authorId' })
  author: Author | null

  @ApiPropertyOptional({
    description: 'ID автора',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ nullable: true, type: 'uuid' })
  authorId: string | null

  @ApiProperty({
    description: 'Дата создания записи',
    example: '2026-01-22T17:00:00Z',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @ApiProperty({
    description: 'Дата обновления записи',
    example: '2026-01-22T17:00:00Z',
  })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date
}
```

### **CreateBookDto с декораторами:**

```typescript
import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateBookDto {
  @ApiProperty({
    description: 'Название книги (обязательное поле)',
    example: 'Война и мир',
  })
  @IsString()
  title: string

  @ApiPropertyOptional({
    description: 'ID автора (опционально)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  authorId?: string

  @ApiPropertyOptional({
    description: 'Жанр книги (опционально)',
    example: 'Роман, Исторический роман',
  })
  @IsString()
  @IsOptional()
  genre?: string

  @ApiPropertyOptional({
    description: 'Рейтинг книги от 0 до 100 (опционально)',
    example: 95,
  })
  @IsOptional()
  rating?: number

  @ApiPropertyOptional({
    description: 'Дата прочтения книги (опционально)',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  readAt?: string

  @ApiPropertyOptional({
    description: 'Год издания (опционально)',
    example: 1869,
  })
  @IsOptional()
  publishYear?: number

  @ApiPropertyOptional({
    description: 'Количество страниц (опционально)',
    example: 1225,
  })
  @IsOptional()
  pageCount?: number

  @ApiPropertyOptional({
    description: 'Комментарий к книге (опционально)',
    example: 'Величайшее произведение русской литературы',
  })
  @IsString()
  @IsOptional()
  comment?: string

  @ApiPropertyOptional({
    description: 'Обложка книги (опционально)',
    example: '/uploads/books/1640995200000-cover.jpg',
  })
  @IsString()
  @IsOptional()
  cover?: string
}
```

### **BooksController с декораторами:**

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger'
import { BooksService } from './books.service'
import { Book } from './entities/book.entity'
import { CreateBookDto } from './dto/create-book.dto'
import { UpdateBookDto } from './dto/update-book.dto'

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseInterceptors(FileInterceptor('cover'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Создать новую книгу',
    description: 'Создает книгу в справочнике с возможностью загрузки обложки',
  })
  @ApiResponse({
    status: 201,
    description: 'Книга создана',
    type: Book,
  })
  @ApiBody({ type: CreateBookDto })
  create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() cover?: Express.Multer.File,
  ): Promise<Book> {
    return this.booksService.create(createBookDto, cover)
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Получить статистику книг',
    description: 'Возвращает общую статистику по книгам',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика книг',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Общее количество книг' },
        thisMonth: { type: 'number', description: 'Книг за текущий месяц' },
        avgRating: { type: 'number', description: 'Средний рейтинг' },
      },
    },
  })
  getStats(): Promise<{
    total: number
    thisMonth: number
    avgRating: number
  }> {
    return this.booksService.getStats()
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список всех книг',
    description: 'Возвращает все книги из справочника с возможностью фильтрации и сортировки',
  })
  @ApiResponse({
    status: 200,
    description: 'Список книг',
    type: [Book],
  })
  @ApiQueryOptional({
    name: 'sortBy',
    description: 'Поле сортировки',
    enum: ['title', 'genre', 'rating', 'readAt', 'publishYear', 'createdAt'],
  })
  @ApiQueryOptional({
    name: 'sortOrder',
    description: 'Порядок сортировки',
    enum: ['ASC', 'DESC'],
  })
  @ApiQueryOptional({
    name: 'authorId',
    description: 'Фильтр по ID автора',
  })
  @ApiQueryOptional({
    name: 'limit',
    description: 'Ограничение количества результатов',
    type: Number,
  })
  findAll(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('authorId') authorId?: string,
    @Query('limit') limit?: string,
  ): Promise<Book[]> {
    return this.booksService.findAll(sortBy, sortOrder, authorId, limit)
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить книгу по ID',
    description: 'Возвращает конкретную книгу из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID книги',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация о книге',
    type: Book,
  })
  @ApiResponse({
    status: 404,
    description: 'Книга не найдена',
  })
  async findOne(@Param('id') id: string): Promise<Book> {
    return this.booksService.findOne(id)
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('cover'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Обновить книгу',
    description: 'Обновляет книгу в справочнике с возможностью замены обложки',
  })
  @ApiParam({
    name: 'id',
    description: 'ID книги',
  })
  @ApiResponse({
    status: 200,
    description: 'Книга обновлена',
    type: Book,
  })
  @ApiResponse({
    status: 404,
    description: 'Книга не найдена',
  })
  @ApiBody({ type: UpdateBookDto })
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFile() cover?: Express.Multer.File,
  ): Promise<Book> {
    return this.booksService.update(id, updateBookDto, cover)
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить книгу',
    description: 'Удаляет книгу из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID книги',
  })
  @ApiResponse({
    status: 200,
    description: 'Книга удалена',
  })
  @ApiResponse({
    status: 404,
    description: 'Книга не найдена',
  })
  async remove(@Param('id') id: string): Promise<void> {
}
bootstrap();
```

### **Доступ к документации:**

- **Swagger UI:** http://localhost:33010/api
- **OpenAPI JSON:** http://localhost:33010/api-json

---

## Примеры запросов

### **Получение списка книг:**

```bash
curl -X GET "http://localhost:33010/books?sortBy=title&sortOrder=ASC"
```

### **Создание книги:**

```bash
curl -X POST "http://localhost:33010/books" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Война и мир",
    "genre": "Роман",
    "authorId": "123e4567-e89b-12d3-a456-426614174000",
    "rating": 95,
    "publishYear": 1869,
    "pageCount": 1225
  }'
```

### **Создание книги с обложкой:**

```bash
curl -X POST "http://localhost:33010/books" \
  -F "title=Война и мир" \
  -F "genre=Роман" \
  -F "cover=@/path/to/cover.jpg"
```

### **Получение статистики:**

```bash
curl -X GET "http://localhost:33010/books/stats"
```

---

## Лучшие практики

### **1. Entity декораторы:**

- Используй `@ApiProperty` для обязательных полей
- Используй `@ApiPropertyOptional` для опциональных полей
- Добавляй понятные описания и примеры

### **2. DTO декораторы:**

- Комбинируй `@ApiProperty` с валидаторами `class-validator`
- Используй `@ApiBody` для указания типа DTO
- Добавляй ограничения и форматы данных

### **3. Контроллеры:**

- Группируй эндпоинты по `@ApiTags`
- Добавляй подробные описания операций
- Указывай все возможные ответы
- Используй `@ApiParam` и `@ApiQuery` для параметров

### **4. File upload:**

- Используй `@ApiConsumes('multipart/form-data')`
- Добавляй `@ApiBody` для FormData
- Описывай файловые поля

---

## Заключение

Swagger интеграция в NestJS предоставляет мощную автоматическую документацию API. Следуя этому руководству, ты получишь:

- 🎯 **Полнофункциональную документацию** для всех эндпоинтов
- 🚀 **Интерактивное тестирование** всех эндпоинтов
- 📚 **Автоматическую генерацию** из кода
- 🌐 **Стандарт OpenAPI 3.0** для интеграции

Эта документация будет всегда актуальной и поможет команде и пользователям эффективно работать с API!
