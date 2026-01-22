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
import { DirectorsService } from './directors.service';
import { Director } from './entities/director.entity';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

@ApiTags('directors')
@Controller('directors')
export class DirectorsController {
  constructor(private readonly directorsService: DirectorsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Создать нового режиссера',
    description:
      'Создает режиссера в справочнике с возможностью загрузки фотографии',
  })
  @ApiResponse({
    status: 201,
    description: 'Режиссер создан',
    type: Director,
  })
  @ApiBody({ type: CreateDirectorDto })
  create(
    @Body() createDirectorDto: CreateDirectorDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Director> {
    return this.directorsService.create(createDirectorDto, photo);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Получить статистику режиссеров',
    description: 'Возвращает общую статистику по режиссерам',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика режиссеров',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Общее количество режиссеров' },
      },
    },
  })
  getStats(): Promise<{
    total: number;
  }> {
    return this.directorsService.getStats();
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список всех режиссеров',
    description:
      'Возвращает всех режиссеров из справочника с возможностью сортировки',
  })
  @ApiResponse({
    status: 200,
    description: 'Список режиссеров',
    type: [Director],
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
  ): Promise<Director[]> {
    return this.directorsService.findAll(sortBy, sortOrder, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить режиссера по ID',
    description: 'Возвращает конкретного режиссера из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID режиссера',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация о режиссере',
    type: Director,
  })
  @ApiResponse({
    status: 404,
    description: 'Режиссер не найден',
  })
  async findOne(@Param('id') id: string): Promise<Director> {
    return this.directorsService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Обновить режиссера',
    description:
      'Обновляет режиссера в справочнике с возможностью замены фотографии',
  })
  @ApiParam({
    name: 'id',
    description: 'ID режиссера',
  })
  @ApiResponse({
    status: 200,
    description: 'Режиссер обновлен',
    type: Director,
  })
  @ApiResponse({
    status: 404,
    description: 'Режиссер не найден',
  })
  @ApiBody({ type: UpdateDirectorDto })
  update(
    @Param('id') id: string,
    @Body() updateDirectorDto: UpdateDirectorDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Director> {
    return this.directorsService.update(id, updateDirectorDto, photo);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить режиссера',
    description: 'Удаляет режиссера из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID режиссера',
  })
  @ApiResponse({
    status: 200,
    description: 'Режиссер удален',
  })
  @ApiResponse({
    status: 404,
    description: 'Режиссер не найден',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.directorsService.remove(id);
  }
}
