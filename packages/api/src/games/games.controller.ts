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
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { GamesService } from './games.service';
import { Game } from './entities/game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('cover'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Создать новую игру',
    description: 'Создает игру в справочнике с возможностью загрузки обложки',
  })
  @ApiResponse({
    status: 201,
    description: 'Игра создана',
    type: Game,
  })
  @ApiResponse({
    status: 422,
    description: 'Ошибка валидации данных игры',
  })
  @ApiBody({ type: CreateGameDto })
  create(
    @Body() createGameDto: CreateGameDto,
    @UploadedFile() cover?: Express.Multer.File,
  ): Promise<Game> {
    return this.gamesService.create(createGameDto, cover);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Получить статистику игр',
    description: 'Возвращает общую статистику по играм',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика игр',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Общее количество игр' },
        thisMonth: { type: 'number', description: 'Игр за текущий месяц' },
        avgRating: { type: 'number', description: 'Средний рейтинг' },
      },
    },
  })
  getStats(): Promise<{
    total: number;
    thisMonth: number;
    avgRating: number;
  }> {
    return this.gamesService.getStats();
  }

  @Get()
  @ApiOperation({
    summary: 'Получить список всех игр',
    description: 'Возвращает все игры из справочника с возможностью сортировки',
  })
  @ApiResponse({
    status: 200,
    description: 'Список игр',
    type: [Game],
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Поле сортировки',
    required: false,
    enum: ['title', 'completionDate', 'rating', 'playTimeHours', 'createdAt'],
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
  ): Promise<Game[]> {
    return this.gamesService.findAll(sortBy, sortOrder, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Получить игру по ID',
    description: 'Возвращает конкретную игру из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID игры',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Информация об игре',
    type: Game,
  })
  @ApiResponse({
    status: 404,
    description: 'Игра не найдена',
  })
  async findOne(@Param('id') id: string): Promise<Game> {
    return this.gamesService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('cover'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Обновить игру',
    description: 'Обновляет игру в справочнике с возможностью замены обложки',
  })
  @ApiParam({
    name: 'id',
    description: 'ID игры',
  })
  @ApiResponse({
    status: 200,
    description: 'Игра обновлена',
    type: Game,
  })
  @ApiResponse({
    status: 404,
    description: 'Игра не найдена',
  })
  @ApiResponse({
    status: 422,
    description: 'Ошибка валидации данных игры',
  })
  @ApiBody({ type: UpdateGameDto })
  update(
    @Param('id') id: string,
    @Body() updateGameDto: UpdateGameDto,
    @UploadedFile() cover?: Express.Multer.File,
  ): Promise<Game> {
    return this.gamesService.update(id, updateGameDto, cover);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Удалить игру',
    description: 'Удаляет игру из справочника',
  })
  @ApiParam({
    name: 'id',
    description: 'ID игры',
  })
  @ApiResponse({
    status: 200,
    description: 'Игра удалена',
  })
  @ApiResponse({
    status: 404,
    description: 'Игра не найдена',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.gamesService.remove(id);
  }
}
