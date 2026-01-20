# Шаблоны кода для модуля книг

## Entity (entities/book.entity.ts)

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

/**
 * Сущность книги в системе отслеживания прочитанного контента
 * @description Основная модель для хранения информации о книгах
 */
@Entity()
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /** Название книги (обязательное поле) */
  @Column()
  title: string

  /** Автор книги (опционально) */
  @Column({ nullable: true, type: 'text' })
  author: string | null

  /** Жанр книги (опционально) */
  @Column({ nullable: true, type: 'text' })
  genre: string | null

  /**
   * Рейтинг книги от 0 до 100
   * @validation Мин: 0, Макс: 100
   */
  @Column({ nullable: true, type: 'int' })
  rating: number | null

  /**
   * Дата прочтения книги
   * @format ISO 8601
   */
  @Column({ nullable: true, type: 'timestamp' })
  readAt: Date | null

  /** Количество страниц (опционально) */
  @Column({ nullable: true, type: 'int' })
  pageCount: number | null

  /** Комментарий к книге (опционально) */
  @Column({ nullable: true, type: 'text' })
  comment: string | null

  /** Год издания (опционально) */
  @Column({ nullable: true, type: 'int' })
  publishYear: number | null

  /** Обложка книги (опционально) */
  @Column({ nullable: true, type: 'text' })
  cover: string | null

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date
}
```

## DTO (dto/create-book.dto.ts)

```typescript
import { IsString, IsOptional, IsNumber, Min, Max, IsDateString } from 'class-validator'

/**
 * DTO для создания новой книги
 * @description Используется для валидации данных при создании книги через API
 * @endpoint POST /books
 */
export class CreateBookDto {
  /**
   * Название книги (обязательное поле)
   * @example "Война и мир"
   */
  @IsString()
  title: string

  /**
   * Автор книги (опционально)
   * @example "Лев Толстой"
   */
  @IsString()
  @IsOptional()
  author?: string

  /**
   * Жанр книги (опционально)
   * @example "Роман, Исторический роман"
   */
  @IsString()
  @IsOptional()
  genre?: string

  /**
   * Рейтинг книги от 0 до 100 (опционально)
   * @description Пользовательская оценка книги
   * @min 0
   * @max 100
   * @example 95
   */
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  rating?: number

  /**
   * Дата прочтения книги (опционально)
   * @description Когда книга была прочитана
   * @format ISO 8601
   * @example "2024-01-15T00:00:00.000Z"
   */
  @IsDateString()
  @IsOptional()
  readAt?: string

  /**
   * Количество страниц (опционально)
   * @example 1225
   */
  @IsNumber()
  @IsOptional()
  pageCount?: number

  /**
   * Комментарий к книге (опционально)
   * @description Личные заметки о книге
   * @example "Величайшее произведение русской литературы"
   */
  @IsString()
  @IsOptional()
  comment?: string

  /**
   * Год издания (опционально)
   * @min 1800
   * @max 2030
   * @example 1869
   */
  @IsNumber()
  @IsOptional()
  publishYear?: number
}
```

## Service (books.service.ts)

```typescript
import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThanOrEqual } from 'typeorm'
import { Book } from './entities/book.entity'
import { CreateBookDto } from './dto/create-book.dto'
import { UpdateBookDto } from './dto/update-book.dto'

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
      })
    }

    const book = this.booksRepository.create({
      ...createBookDto,
      readAt: createBookDto.readAt ? new Date(createBookDto.readAt) : null,
    })

    return this.booksRepository.save(book)
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    author?: string,
    limit?: string,
  ): Promise<Book[]> {
    const queryBuilder = this.booksRepository.createQueryBuilder('book')

    if (author) {
      queryBuilder.where('book.author ILIKE :author', { author: `%${author}%` })
    }

    if (sortBy) {
      const validSortFields = [
        'title',
        'author',
        'genre',
        'rating',
        'readAt',
        'publishYear',
        'createdAt',
      ]
      if (validSortFields.includes(sortBy)) {
        if (sortBy === 'rating') {
          if (sortOrder === 'DESC') {
            queryBuilder.orderBy('book.rating IS NULL', 'ASC').addOrderBy('book.rating', 'DESC')
          } else {
            queryBuilder.orderBy('book.rating IS NULL', 'ASC').addOrderBy('book.rating', 'ASC')
          }
        } else {
          queryBuilder.orderBy(`book.${sortBy}`, sortOrder || 'ASC')
        }
      }
    } else {
      queryBuilder.orderBy('book.readAt', 'DESC')
    }

    if (limit) {
      const limitNum = parseInt(limit, 10)
      if (!isNaN(limitNum) && limitNum > 0) {
        queryBuilder.limit(limitNum)
      }
    }

    return queryBuilder.getMany()
  }

  async findOne(id: string): Promise<Book> {
    const book = await this.booksRepository.findOne({ where: { id } })
    if (!book) {
      throw new NotFoundException(`Книга с ID ${id} не найдена`)
    }
    return book
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<Book> {
    if (updateBookDto.title !== undefined && !updateBookDto.title?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении книги',
        violations: [{ field: 'title', message: 'Название не может быть пустым' }],
      })
    }

    const book = await this.findOne(id)

    const updatedBook = {
      ...book,
      ...updateBookDto,
      readAt: updateBookDto.readAt ? new Date(updateBookDto.readAt) : book.readAt,
      updatedAt: new Date(),
    }

    return this.booksRepository.save(updatedBook)
  }

  async remove(id: string): Promise<void> {
    const book = await this.findOne(id)
    await this.booksRepository.delete(id)
  }

  async getStats(): Promise<{
    total: number
    thisMonth: number
    avgRating: number
  }> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

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
    ])

    return {
      total,
      thisMonth,
      avgRating: avgRatingResult?.avgRating ? parseFloat(avgRatingResult.avgRating) : 0,
    }
  }
}
```

## Controller (books.controller.ts)

```typescript
import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common'
import { BooksService } from './books.service'
import { Book } from './entities/book.entity'
import { CreateBookDto } from './dto/create-book.dto'
import { UpdateBookDto } from './dto/update-book.dto'

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  create(@Body() createBookDto: CreateBookDto): Promise<Book> {
    return this.booksService.create(createBookDto)
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
    @Query('author') author?: string,
    @Query('limit') limit?: string,
  ): Promise<Book[]> {
    return this.booksService.findAll(sortBy, sortOrder, author, limit)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Book> {
    return this.booksService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto): Promise<Book> {
    return this.booksService.update(id, updateBookDto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.booksService.remove(id)
  }
}
```

## Module (books.module.ts)

```typescript
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BooksService } from './books.service'
import { BooksController } from './books.controller'
import { Book } from './entities/book.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Book])],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
```

## Frontend компоненты

### Страница списка (pages/books/index.vue)

```vue
<template>
  <div class="mx-auto max-w-7xl">
    <Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Книги' }]" />

    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Книги</h2>
      <NuxtLink
        to="/books/new"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Добавить книгу
      </NuxtLink>
    </div>

    <div v-if="!books?.length" class="text-center py-12 text-gray-500">
      Книг пока нет. Добавьте свою первую книгу!
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="book in books"
        :key="book.id"
        class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ book.title }}</h3>
        <p v-if="book.author" class="text-gray-600 text-sm mb-2">{{ book.author }}</p>
        <p v-if="book.genre" class="text-gray-500 text-xs mb-4">{{ book.genre }}</p>

        <div class="flex justify-between items-center">
          <div class="text-xs text-gray-500">
            <span v-if="book.readAt">{{ formatDate(book.readAt) }}</span>
            <span v-if="book.rating" class="ml-2 text-blue-600 font-medium">
              ★ {{ book.rating }}/100
            </span>
          </div>
          <div class="flex gap-2">
            <NuxtLink
              :to="`/books/${book.id}/edit`"
              class="text-blue-600 hover:text-blue-800 text-sm"
            >
              Редактировать
            </NuxtLink>
            <button @click="deleteBook(book.id)" class="text-red-600 hover:text-red-800 text-sm">
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { data: books } = await useAsyncData('books', () => $fetch('/api/books'))

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU')
}

const deleteBook = async (id) => {
  if (confirm('Вы уверены?')) {
    await $fetch(`/api/books/${id}`, { method: 'DELETE' })
    await refreshNuxtData('books')
  }
}
</script>
```

### Компонент поиска Google Books

```vue
<template>
  <div class="relative" ref="containerRef">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}<span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :id="id"
      v-model.trim="query"
      type="text"
      autocomplete="off"
      @input="onSearchInput"
      @focus="showSuggestions = true"
      class="mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2"
      :placeholder="placeholder"
    />
    <div
      v-if="showSuggestions && suggestions.length > 0"
      class="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto"
    >
      <button
        v-for="item in suggestions"
        :key="item.id"
        type="button"
        class="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-3 transition-colors"
        @click="selectBook(item)"
      >
        <img
          v-if="item.volumeInfo.imageLinks?.thumbnail"
          :src="item.volumeInfo.imageLinks.thumbnail"
          :alt="item.volumeInfo.title"
          class="w-8 h-12 rounded object-cover"
        />
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-900">{{ item.volumeInfo.title }}</div>
          <div v-if="item.volumeInfo.authors" class="text-xs text-gray-500">
            {{ item.volumeInfo.authors.join(', ') }}
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const GOOGLE_BOOKS_API_KEY = config.public.googleBooksApiKey;

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    publishedDate?: string;
    description?: string;
    imageLinks?: {
      thumbnail?: string;
    };
  };
}

const props = defineProps({
  modelValue: Object,
  label: String,
  placeholder: String,
  required: Boolean,
  id: String,
});

const emit = defineEmits(['update:modelValue']);

const containerRef = ref(null);
const query = ref(props.modelValue?.title ?? '');
const suggestions = ref([]);
const showSuggestions = ref(false);
let searchTimeout = null;

const searchBooks = async (searchQuery) => {
  if (!searchQuery || searchQuery.length < 2) {
    suggestions.value = [];
    return;
  }

  try {
    const response = await $fetch('https://www.googleapis.com/books/v1/volumes', {
      params: {
        q: searchQuery,
        key: GOOGLE_BOOKS_API_KEY,
        maxResults: 10,
        langRestrict: 'ru',
      },
    });
    suggestions.value = response.items || [];
  } catch (e) {
    console.error('Google Books search error:', e);
    suggestions.value = [];
  }
};

const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchBooks(query.value);
  }, 300);
};

const selectBook = (selected) => {
  query.value = selected.volumeInfo.title;
  suggestions.value = [];
  showSuggestions.value = false;
  emit('update:modelValue', selected);
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (e) => {
  const target = e.target;
  if (containerRef.value && !containerRef.value.contains(target)) {
    showSuggestions.value = false;
  }
};
</script>
```

## Индексы для PostgreSQL

```sql
-- Индексы для таблицы books
CREATE INDEX CONCURRENTLY idx_books_read_at ON books(read_at DESC);
CREATE INDEX CONCURRENTLY idx_books_rating ON books(rating DESC NULLS LAST);
CREATE INDEX CONCURRENTLY idx_books_created_at ON books(created_at DESC);
CREATE INDEX CONCURRENTLY idx_books_author ON books(author);
CREATE INDEX CONCURRENTLY idx_books_title ON books(title);
```
