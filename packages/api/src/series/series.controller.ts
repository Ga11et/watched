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
import { SeriesService } from './series.service';
import { Series } from './entities/series.entity';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

@ApiTags('series')
@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('poster'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Создать новый сериал',
    description: 'Создает сериал в справочнике с возможностью загрузки постера',
  })
  @ApiResponse({
    status: 201,
    description: 'Сериал создан',
    type: Series,
  })
  @ApiBody({ type: CreateSeriesDto })
  create(
    @Body() createSeriesDto: CreateSeriesDto,
    @UploadedFile() poster?: Express.Multer.File,
  ): Promise<Series> {
    return this.seriesService.create(createSeriesDto, poster);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Получить статистику сериалов',
    description: 'Возвращает общую статистику по сериалам',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика сериалов',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Общее количество сериалов' },
        thisMonth: { type: 'number', description: 'Сериалов за текущий месяц' },
        avgRating: { type: 'number', description: 'Средний рейтинг' },
      },
    },
  })
  getStats(): Promise<{
    total: number;
    thisMonth: number;
    avgRating: number;
  }> {
    return this.seriesService.getStats();
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список всех сериалов',
    description:
      'Возвращает все сериалы из справочника с возможностью сортировки',
  })
  @ApiResponse({
    status: 200,
    description: 'Список сериалов',
    type: [Series],
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Поле сортировки',
    required: false,
    enum: [
      'title',
      'rating',
      'watchedSeasons',
      'totalSeasons',
      'watchedAt',
      'createdAt',
    ],
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Порядок сортировки',
    required: false,
    enum: ['ASC', 'DESC'],
  })
  findAll(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<Series[]> {
    return this.seriesService.findAll(sortBy, sortOrder);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить сериал по ID',
    description: 'Возвращает конкретный сериал из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID сериала',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация о сериале',
    type: Series,
  })
  @ApiResponse({
    status: 404,
    description: 'Сериал не найден',
  })
  async findOne(@Param('id') id: string): Promise<Series> {
    return this.seriesService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('poster'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Обновить сериал',
    description: 'Обновляет сериал в справочнике с возможностью замены постера',
  })
  @ApiParam({
    name: 'id',
    description: 'ID сериала',
  })
  @ApiResponse({
    status: 200,
    description: 'Сериал обновлен',
    type: Series,
  })
  @ApiResponse({
    status: 404,
    description: 'Сериал не найден',
  })
  @ApiBody({ type: UpdateSeriesDto })
  update(
    @Param('id') id: string,
    @Body() updateSeriesDto: UpdateSeriesDto,
    @UploadedFile() poster?: Express.Multer.File,
  ): Promise<Series> {
    return this.seriesService.update(id, updateSeriesDto, poster);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить сериал',
    description: 'Удаляет сериал из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID сериала',
  })
  @ApiResponse({
    status: 200,
    description: 'Сериал удален',
  })
  @ApiResponse({
    status: 404,
    description: 'Сериал не найден',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.seriesService.remove(id);
  }
}
