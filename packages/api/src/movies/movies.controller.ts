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
import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('poster'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Создать новый фильм',
    description: 'Создает фильм в справочнике с возможностью загрузки постера',
  })
  @ApiResponse({
    status: 201,
    description: 'Фильм создан',
    type: Movie,
  })
  @ApiBody({ type: CreateMovieDto })
  create(
    @Body() createMovieDto: CreateMovieDto,
    @UploadedFile() poster?: Express.Multer.File,
  ): Promise<Movie> {
    return this.moviesService.create(createMovieDto, poster);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Получить статистику фильмов',
    description: 'Возвращает общую статистику по фильмам',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика фильмов',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Общее количество фильмов' },
        thisMonth: { type: 'number', description: 'Фильмов за текущий месяц' },
        avgRating: { type: 'number', description: 'Средний рейтинг' },
      },
    },
  })
  getStats(): Promise<{
    total: number;
    thisMonth: number;
    avgRating: number;
  }> {
    return this.moviesService.getStats();
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список всех фильмов',
    description:
      'Возвращает все фильмы из справочника с возможностью фильтрации и сортировки',
  })
  @ApiResponse({
    status: 200,
    description: 'Список фильмов',
    type: [Movie],
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Поле сортировки',
    required: false,
    enum: ['title', 'genre', 'rating', 'watchedAt', 'releaseYear', 'createdAt'],
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Порядок сортировки',
    required: false,
    enum: ['ASC', 'DESC'],
  })
  @ApiQuery({
    name: 'directorId',
    description: 'Фильтр по ID режиссера',
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
    @Query('directorId') directorId?: string,
    @Query('limit') limit?: string,
  ): Promise<Movie[]> {
    return this.moviesService.findAll(sortBy, sortOrder, directorId, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить фильм по ID',
    description: 'Возвращает конкретный фильм из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID фильма',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация о фильме',
    type: Movie,
  })
  @ApiResponse({
    status: 404,
    description: 'Фильм не найден',
  })
  async findOne(@Param('id') id: string): Promise<Movie> {
    return this.moviesService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('poster'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Обновить фильм',
    description: 'Обновляет фильм в справочнике с возможностью замены постера',
  })
  @ApiParam({
    name: 'id',
    description: 'ID фильма',
  })
  @ApiResponse({
    status: 200,
    description: 'Фильм обновлен',
    type: Movie,
  })
  @ApiResponse({
    status: 404,
    description: 'Фильм не найден',
  })
  @ApiBody({ type: UpdateMovieDto })
  update(
    @Param('id') id: string,
    @Body() updateMovieDto: UpdateMovieDto,
    @UploadedFile() poster?: Express.Multer.File,
  ): Promise<Movie> {
    return this.moviesService.update(id, updateMovieDto, poster);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить фильм',
    description: 'Удаляет фильм из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID фильма',
  })
  @ApiResponse({
    status: 200,
    description: 'Фильм удален',
  })
  @ApiResponse({
    status: 404,
    description: 'Фильм не найден',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.moviesService.remove(id);
  }
}
