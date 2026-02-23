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
import { PublishersService } from './publishers.service';
import { Publisher } from './entities/publisher.entity';
import { CreatePublisherDto } from './dto/create-publisher.dto';
import { UpdatePublisherDto } from './dto/update-publisher.dto';

@ApiTags('publishers')
@Controller('publishers')
export class PublishersController {
  constructor(private readonly publishersService: PublishersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Создать нового издателя',
    description:
      'Создает издателя в справочнике с возможностью загрузки логотипа',
  })
  @ApiResponse({
    status: 201,
    description: 'Издатель создан',
    type: Publisher,
  })
  @ApiResponse({
    status: 422,
    description: 'Ошибка валидации данных издателя',
  })
  @ApiBody({ type: CreatePublisherDto })
  create(
    @Body() createPublisherDto: CreatePublisherDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Publisher> {
    return this.publishersService.create(createPublisherDto, photo);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Получить статистику издателей',
    description: 'Возвращает общую статистику по издателям',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика издателей',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Общее количество издателей' },
      },
    },
  })
  getStats(): Promise<{ total: number }> {
    return this.publishersService.getStats();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Поиск издателей по имени',
    description: 'Ищет издателей по названию',
  })
  @ApiResponse({
    status: 200,
    description: 'Результаты поиска',
    type: [Publisher],
  })
  @ApiQuery({
    name: 'q',
    description: 'Поисковый запрос',
    required: true,
  })
  searchByName(@Query('q') query: string): Promise<Publisher[]> {
    return this.publishersService.searchByName(query);
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список всех издателей',
    description:
      'Возвращает всех издателей из справочника с возможностью сортировки',
  })
  @ApiResponse({
    status: 200,
    description: 'Список издателей',
    type: [Publisher],
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Поле сортировки',
    required: false,
    enum: ['fullName', 'createdAt'],
  })
  @ApiQuery({
    name: 'sortOrder',
    description: 'Порядок сортировки',
    required: false,
    enum: ['ASC', 'DESC'],
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
    @Query('limit') limit?: string,
  ): Promise<Publisher[]> {
    return this.publishersService.findAll(sortBy, sortOrder, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить издателя по ID',
    description: 'Возвращает конкретного издателя из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID издателя',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация об издателе',
    type: Publisher,
  })
  @ApiResponse({
    status: 404,
    description: 'Издатель не найден',
  })
  async findOne(@Param('id') id: string): Promise<Publisher> {
    return this.publishersService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Обновить издателя',
    description:
      'Обновляет издателя в справочнике с возможностью замены логотипа',
  })
  @ApiParam({
    name: 'id',
    description: 'ID издателя',
  })
  @ApiResponse({
    status: 200,
    description: 'Издатель обновлен',
    type: Publisher,
  })
  @ApiResponse({
    status: 404,
    description: 'Издатель не найден',
  })
  @ApiResponse({
    status: 422,
    description: 'Ошибка валидации данных издателя',
  })
  @ApiBody({ type: UpdatePublisherDto })
  update(
    @Param('id') id: string,
    @Body() updatePublisherDto: UpdatePublisherDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Publisher> {
    return this.publishersService.update(id, updatePublisherDto, photo);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить издателя',
    description: 'Удаляет издателя из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID издателя',
  })
  @ApiResponse({
    status: 200,
    description: 'Издатель удален',
  })
  @ApiResponse({
    status: 404,
    description: 'Издатель не найден',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.publishersService.remove(id);
  }
}
