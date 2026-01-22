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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

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
    return this.booksService.create(createBookDto, cover);
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
    total: number;
    thisMonth: number;
    avgRating: number;
  }> {
    return this.booksService.getStats();
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список всех книг',
    description:
      'Возвращает все книги из справочника с возможностью фильтрации и сортировки',
  })
  @ApiResponse({
    status: 200,
    description: 'Список книг',
    type: [Book],
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Поле сортировки',
    required: false,
    enum: ['title', 'genre', 'rating', 'readAt', 'publishYear', 'createdAt'],
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Порядок сортировки',
    required: false,
    enum: ['ASC', 'DESC'],
  })
  @ApiQuery({
    name: 'authorId',
    description: 'Фильтр по ID автора',
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Ограничение количества результатов',
    required: false,
    type: Number,
  })
  findAll(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('authorId') authorId?: string,
    @Query('limit') limit?: string,
  ): Promise<Book[]> {
    return this.booksService.findAll(sortBy, sortOrder, authorId, limit);
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
    return this.booksService.findOne(id);
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
    return this.booksService.update(id, updateBookDto, cover);
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
    return this.booksService.remove(id);
  }
}
