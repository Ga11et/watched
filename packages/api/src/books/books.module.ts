import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Book } from './entities/book.entity';
import { Author } from '../authors/entities/author.entity';
import { AuthorsModule } from '../authors/authors.module';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Author]), AuthorsModule],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
