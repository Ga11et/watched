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
import { DevelopersService } from './developers.service';
import { Developer } from './entities/developer.entity';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';

@ApiTags('developers')
@Controller('developers')
export class DevelopersController {
  constructor(private readonly developersService: DevelopersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Создать нового разработчика',
    description:
      'Создает разработчика в справочнике с возможностью загрузки логотипа',
  })
  @ApiResponse({
    status: 201,
    description: 'Разработчик создан',
    type: Developer,
  })
  @ApiResponse({
    status: 422,
    description: 'Ошибка валидации данных разработчика',
  })
  @ApiBody({ type: CreateDeveloperDto })
  create(
    @Body() createDeveloperDto: CreateDeveloperDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Developer> {
    return this.developersService.create(createDeveloperDto, photo);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Получить статистику разработчиков',
    description: 'Возвращает общую статистику по разработчикам',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика разработчиков',
    schema: {
      type: 'object',
      properties: {
        total: {
          type: 'number',
          description: 'Общее количество разработчиков',
        },
      },
    },
  })
  getStats(): Promise<{ total: number }> {
    return this.developersService.getStats();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Поиск разработчиков по имени',
    description: 'Ищет разработчиков по названию',
  })
  @ApiResponse({
    status: 200,
    description: 'Результаты поиска',
    type: [Developer],
  })
  @ApiQuery({
    name: 'q',
    description: 'Поисковый запрос',
    required: true,
  })
  searchByName(@Query('q') query: string): Promise<Developer[]> {
    return this.developersService.searchByName(query);
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список всех разработчиков',
    description:
      'Возвращает всех разработчиков из справочника с возможностью сортировки',
  })
  @ApiResponse({
    status: 200,
    description: 'Список разработчиков',
    type: [Developer],
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
  ): Promise<Developer[]> {
    return this.developersService.findAll(sortBy, sortOrder, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить разработчика по ID',
    description:
      'Возвращает конкретного разработчика из справочника вместе со связанными играми',
  })
  @ApiParam({
    name: 'id',
    description: 'ID разработчика',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация о разработчике со списком связанных игр',
    type: Developer,
  })
  @ApiResponse({
    status: 404,
    description: 'Разработчик не найден',
  })
  async findOne(@Param('id') id: string): Promise<Developer> {
    return this.developersService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Обновить разработчика',
    description:
      'Обновляет разработчика в справочнике с возможностью замены логотипа',
  })
  @ApiParam({
    name: 'id',
    description: 'ID разработчика',
  })
  @ApiResponse({
    status: 200,
    description: 'Разработчик обновлен',
    type: Developer,
  })
  @ApiResponse({
    status: 404,
    description: 'Разработчик не найден',
  })
  @ApiResponse({
    status: 422,
    description: 'Ошибка валидации данных разработчика',
  })
  @ApiBody({ type: UpdateDeveloperDto })
  update(
    @Param('id') id: string,
    @Body() updateDeveloperDto: UpdateDeveloperDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Developer> {
    return this.developersService.update(id, updateDeveloperDto, photo);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить разработчика',
    description: 'Удаляет разработчика из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID разработчика',
  })
  @ApiResponse({
    status: 200,
    description: 'Разработчик удален',
  })
  @ApiResponse({
    status: 404,
    description: 'Разработчик не найден',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.developersService.remove(id);
  }
}
