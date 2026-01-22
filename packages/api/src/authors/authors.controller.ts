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
import { AuthorsService } from './authors.service';
import { Author } from './entities/author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@ApiTags('authors')
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Создать нового автора',
    description:
      'Создает автора в справочнике с возможностью загрузки фотографии',
  })
  @ApiResponse({
    status: 201,
    description: 'Автор создан',
    type: Author,
  })
  @ApiBody({ type: CreateAuthorDto })
  create(
    @Body() createAuthorDto: CreateAuthorDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Author> {
    return this.authorsService.create(createAuthorDto, photo);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Получить статистику авторов',
    description: 'Возвращает общую статистику по авторам',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика авторов',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Общее количество авторов' },
      },
    },
  })
  getStats(): Promise<{
    total: number;
  }> {
    return this.authorsService.getStats();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Поиск авторов по имени',
    description: 'Ищет авторов по полному имени',
  })
  @ApiResponse({
    status: 200,
    description: 'Результаты поиска',
    type: [Author],
  })
  @ApiQuery({
    name: 'q',
    description: 'Поисковый запрос',
    required: true,
  })
  searchByName(@Query('q') query: string): Promise<Author[]> {
    return this.authorsService.searchByName(query);
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список всех авторов',
    description:
      'Возвращает всех авторов из справочника с возможностью сортировки',
  })
  @ApiResponse({
    status: 200,
    description: 'Список авторов',
    type: [Author],
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
  ): Promise<Author[]> {
    return this.authorsService.findAll(sortBy, sortOrder, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить автора по ID',
    description: 'Возвращает конкретного автора из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID автора',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация об авторе',
    type: Author,
  })
  @ApiResponse({
    status: 404,
    description: 'Автор не найден',
  })
  async findOne(@Param('id') id: string): Promise<Author> {
    return this.authorsService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Обновить автора',
    description:
      'Обновляет автора в справочнике с возможностью замены фотографии',
  })
  @ApiParam({
    name: 'id',
    description: 'ID автора',
  })
  @ApiResponse({
    status: 200,
    description: 'Автор обновлен',
    type: Author,
  })
  @ApiResponse({
    status: 404,
    description: 'Автор не найден',
  })
  @ApiBody({ type: UpdateAuthorDto })
  update(
    @Param('id') id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Author> {
    return this.authorsService.update(id, updateAuthorDto, photo);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить автора',
    description: 'Удаляет автора из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID автора',
  })
  @ApiResponse({
    status: 200,
    description: 'Автор удален',
  })
  @ApiResponse({
    status: 404,
    description: 'Автор не найден',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.authorsService.remove(id);
  }
}
