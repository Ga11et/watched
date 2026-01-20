import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from './entities/author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthorsService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads', 'authors');

  constructor(
    @InjectRepository(Author)
    private authorsRepository: Repository<Author>,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async create(
    createAuthorDto: CreateAuthorDto,
    photo?: Express.Multer.File,
  ): Promise<Author> {
    if (!createAuthorDto.fullName?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании автора',
        violations: [{ field: 'fullName', message: 'Имя автора обязательно' }],
      });
    }

    let photoPath: string | null = null;

    if (photo) {
      const fileName = `${Date.now()}-${photo.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, photo.buffer);
      photoPath = `/uploads/authors/${fileName}`;
    }

    const author = this.authorsRepository.create({
      ...createAuthorDto,
      photo: photoPath,
    });

    return this.authorsRepository.save(author);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    limit?: string,
  ): Promise<Author[]> {
    const queryBuilder = this.authorsRepository.createQueryBuilder('author');

    if (sortBy) {
      const validSortFields = ['fullName', 'createdAt'];
      if (validSortFields.includes(sortBy)) {
        queryBuilder.orderBy(`author.${sortBy}`, sortOrder || 'ASC');
      }
    } else {
      queryBuilder.orderBy('author.fullName', 'ASC');
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        queryBuilder.limit(limitNum);
      }
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Author> {
    const author = await this.authorsRepository.findOne({
      where: { id },
    });

    if (!author) {
      throw new NotFoundException(`Автор с ID ${id} не найден`);
    }
    return author;
  }

  async update(
    id: string,
    updateAuthorDto: UpdateAuthorDto,
    photo?: Express.Multer.File,
  ): Promise<Author> {
    if (
      updateAuthorDto.fullName !== undefined &&
      !updateAuthorDto.fullName?.trim()
    ) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении автора',
        violations: [
          { field: 'fullName', message: 'Имя автора не может быть пустым' },
        ],
      });
    }

    const author = await this.findOne(id);

    // Удаление текущего фото если есть флаг removePhoto или новое фото
    if (author.photo && (updateAuthorDto.removePhoto || photo)) {
      const oldPhotoPath = path.join(process.cwd(), author.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
      author.photo = null;
    }

    // Сохранение нового фото если есть
    if (photo) {
      const fileName = `${Date.now()}-${photo.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, photo.buffer);
      author.photo = `/uploads/authors/${fileName}`;
    }

    const updatedAuthor = {
      ...author,
      ...updateAuthorDto,
      photo: author.photo,
      updatedAt: new Date(),
    };

    return this.authorsRepository.save(updatedAuthor);
  }

  async remove(id: string): Promise<void> {
    const author = await this.findOne(id);

    if (author.photo) {
      const photoPath = path.join(process.cwd(), author.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await this.authorsRepository.delete(id);
  }

  async getStats(): Promise<{
    total: number;
  }> {
    const total = await this.authorsRepository.count();

    return {
      total,
    };
  }

  async searchByName(query: string): Promise<Author[]> {
    return this.authorsRepository
      .createQueryBuilder('author')
      .where('author.fullName ILIKE :query', { query: `%${query}%` })
      .orderBy('author.fullName', 'ASC')
      .limit(10)
      .getMany();
  }
}
