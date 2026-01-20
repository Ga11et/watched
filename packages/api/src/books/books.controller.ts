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
import { BooksService } from './books.service';
import { Book } from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseInterceptors(FileInterceptor('cover'))
  create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() cover?: Express.Multer.File,
  ): Promise<Book> {
    return this.booksService.create(createBookDto, cover);
  }

  @Get('stats')
  getStats(): Promise<{
    total: number;
    thisMonth: number;
    avgRating: number;
  }> {
    return this.booksService.getStats();
  }

  @Get()
  findAll(
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('authorId') authorId?: string,
    @Query('limit') limit?: string,
  ): Promise<Book[]> {
    return this.booksService.findAll(sortBy, sortOrder, authorId, limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Book> {
    return this.booksService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('cover'))
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @UploadedFile() cover?: Express.Multer.File,
  ): Promise<Book> {
    return this.booksService.update(id, updateBookDto, cover);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.booksService.remove(id);
  }
}
