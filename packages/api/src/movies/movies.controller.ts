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
import { MoviesService } from './movies.service';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('poster'))
  create(
    @Body() createMovieDto: CreateMovieDto,
    @UploadedFile() poster?: Express.Multer.File,
  ): Promise<Movie> {
    return this.moviesService.create(createMovieDto, poster);
  }

  @Get()
  findAll(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('directorId') directorId?: string,
  ): Promise<Movie[]> {
    return this.moviesService.findAll(sortBy, sortOrder, directorId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Movie> {
    return this.moviesService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('poster'))
  update(
    @Param('id') id: string,
    @Body() updateMovieDto: UpdateMovieDto,
    @UploadedFile() poster?: Express.Multer.File,
  ): Promise<Movie> {
    return this.moviesService.update(id, updateMovieDto, poster);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.moviesService.remove(id);
  }
}
