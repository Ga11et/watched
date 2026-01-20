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
import { AuthorsService } from './authors.service';
import { Author } from './entities/author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  create(
    @Body() createAuthorDto: CreateAuthorDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Author> {
    return this.authorsService.create(createAuthorDto, photo);
  }

  @Get('stats')
  getStats(): Promise<{
    total: number;
  }> {
    return this.authorsService.getStats();
  }

  @Get('search')
  searchByName(@Query('q') query: string): Promise<Author[]> {
    return this.authorsService.searchByName(query);
  }

  @Get()
  findAll(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('limit') limit?: string,
  ): Promise<Author[]> {
    return this.authorsService.findAll(sortBy, sortOrder, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Author> {
    return this.authorsService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photo'))
  update(
    @Param('id') id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<Author> {
    return this.authorsService.update(id, updateAuthorDto, photo);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.authorsService.remove(id);
  }
}
