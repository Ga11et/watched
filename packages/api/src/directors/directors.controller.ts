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
import { DirectorsService } from './directors.service';
import { Director } from './entities/director.entity';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

@Controller('directors')
export class DirectorsController {
  constructor(private readonly directorsService: DirectorsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  create(
    @Body() createDirectorDto: CreateDirectorDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Director> {
    return this.directorsService.create(createDirectorDto, photo);
  }

  @Get()
  findAll(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<Director[]> {
    return this.directorsService.findAll(sortBy, sortOrder);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Director> {
    return this.directorsService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photo'))
  update(
    @Param('id') id: string,
    @Body() updateDirectorDto: UpdateDirectorDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Director> {
    return this.directorsService.update(id, updateDirectorDto, photo);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.directorsService.remove(id);
  }
}
