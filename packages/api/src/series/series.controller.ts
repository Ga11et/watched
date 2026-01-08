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
import { SeriesService } from './series.service';
import { Series } from './entities/series.entity';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('poster'))
  create(
    @Body() createSeriesDto: CreateSeriesDto,
    @UploadedFile() poster?: Express.Multer.File,
  ): Promise<Series> {
    return this.seriesService.create(createSeriesDto, poster);
  }

  @Get('stats')
  getStats(): Promise<{
    total: number;
    thisMonth: number;
    avgRating: number;
  }> {
    return this.seriesService.getStats();
  }

  @Get()
  findAll(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<Series[]> {
    return this.seriesService.findAll(sortBy, sortOrder);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Series> {
    return this.seriesService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('poster'))
  update(
    @Param('id') id: string,
    @Body() updateSeriesDto: UpdateSeriesDto,
    @UploadedFile() poster?: Express.Multer.File,
  ): Promise<Series> {
    return this.seriesService.update(id, updateSeriesDto, poster);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.seriesService.remove(id);
  }
}
