import {
  Injectable,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Director } from './entities/director.entity';
import { Movie } from '../movies/entities/movie.entity';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DirectorsService {
  private readonly uploadPath = path.join(
    process.cwd(),
    'uploads',
    'directors',
  );

  constructor(
    @InjectRepository(Director)
    private directorsRepository: Repository<Director>,
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async create(
    createDirectorDto: CreateDirectorDto,
    photo?: Express.Multer.File,
  ): Promise<Director> {
    if (!createDirectorDto.fullName?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании режиссёра',
        violations: [{ field: 'fullName', message: 'ФИО обязательно' }],
      });
    }

    let photoPath: string | null = null;

    if (photo) {
      const fileName = `${Date.now()}-${photo.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, photo.buffer);
      photoPath = `/uploads/directors/${fileName}`;
    }

    const director = this.directorsRepository.create({
      ...createDirectorDto,
      photo: photoPath,
    });

    return this.directorsRepository.save(director);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ): Promise<Director[]> {
    const queryBuilder =
      this.directorsRepository.createQueryBuilder('director');

    if (sortBy) {
      const validSortFields = ['fullName', 'createdAt'];
      if (validSortFields.includes(sortBy)) {
        queryBuilder.orderBy(`director.${sortBy}`, sortOrder || 'ASC');
      }
    } else {
      queryBuilder.orderBy('director.createdAt', 'DESC');
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Director> {
    const director = await this.directorsRepository.findOne({ where: { id } });
    if (!director) {
      throw new NotFoundException(`Режиссёр с ID ${id} не найден`);
    }
    return director;
  }

  async update(
    id: string,
    updateDirectorDto: UpdateDirectorDto,
    photo?: Express.Multer.File,
  ): Promise<Director> {
    if (
      updateDirectorDto.fullName !== undefined &&
      !updateDirectorDto.fullName?.trim()
    ) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении режиссёра',
        violations: [
          { field: 'fullName', message: 'ФИО не может быть пустым' },
        ],
      });
    }

    const director = await this.findOne(id);

    // Удаление текущего фото если есть флаг removePhoto или новое фото
    if (director.photo && (updateDirectorDto.removePhoto || photo)) {
      const oldPhotoPath = path.join(process.cwd(), director.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
      director.photo = null;
    }

    // Сохранение нового фото если есть
    if (photo) {
      const fileName = `${Date.now()}-${photo.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, photo.buffer);
      director.photo = `/uploads/directors/${fileName}`;
    }

    const updatedDirector = {
      ...director,
      ...updateDirectorDto,
      photo: director.photo,
    };

    return this.directorsRepository.save(updatedDirector);
  }

  async remove(id: string): Promise<void> {
    const director = await this.findOne(id);

    if (director.photo) {
      const photoPath = path.join(process.cwd(), director.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    // Remove director reference from all movies
    await this.moviesRepository.update(
      { directorId: id },
      { directorId: null },
    );

    await this.directorsRepository.delete(id);
  }
}
