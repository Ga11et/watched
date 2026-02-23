import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Developer } from './entities/developer.entity';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';
import { Game } from '../games/entities/game.entity';

@Injectable()
export class DevelopersService {
  private readonly uploadPath = path.join(
    process.cwd(),
    'uploads',
    'developers',
  );

  constructor(
    @InjectRepository(Developer)
    private developersRepository: Repository<Developer>,
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async create(
    createDeveloperDto: CreateDeveloperDto,
    photo?: Express.Multer.File,
  ): Promise<Developer> {
    if (!createDeveloperDto.fullName?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании разработчика',
        violations: [
          { field: 'fullName', message: 'Название разработчика обязательно' },
        ],
      });
    }

    let photoPath: string | null = null;

    if (photo) {
      const fileName = `${Date.now()}-${photo.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, photo.buffer);
      photoPath = `/uploads/developers/${fileName}`;
    }

    const developer = this.developersRepository.create({
      ...createDeveloperDto,
      photo: photoPath,
    });

    return this.developersRepository.save(developer);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    limit?: string,
  ): Promise<Developer[]> {
    const queryBuilder =
      this.developersRepository.createQueryBuilder('developer');

    if (sortBy) {
      const validSortFields = ['fullName', 'createdAt'];
      if (validSortFields.includes(sortBy)) {
        queryBuilder.orderBy(`developer.${sortBy}`, sortOrder || 'ASC');
      }
    } else {
      queryBuilder.orderBy('developer.fullName', 'ASC');
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        queryBuilder.limit(limitNum);
      }
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Developer> {
    const developer = await this.developersRepository.findOne({
      where: { id },
    });

    if (!developer) {
      throw new NotFoundException(`Разработчик с ID ${id} не найден`);
    }

    return developer;
  }

  async update(
    id: string,
    updateDeveloperDto: UpdateDeveloperDto,
    photo?: Express.Multer.File,
  ): Promise<Developer> {
    if (
      updateDeveloperDto.fullName !== undefined &&
      !updateDeveloperDto.fullName?.trim()
    ) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении разработчика',
        violations: [
          {
            field: 'fullName',
            message: 'Название разработчика не может быть пустым',
          },
        ],
      });
    }

    const developer = await this.findOne(id);

    if (developer.photo && (updateDeveloperDto.removePhoto || photo)) {
      const oldPhotoPath = path.join(process.cwd(), developer.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
      developer.photo = null;
    }

    if (photo) {
      const fileName = `${Date.now()}-${photo.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, photo.buffer);
      developer.photo = `/uploads/developers/${fileName}`;
    }

    const updatedDeveloper = {
      ...developer,
      ...updateDeveloperDto,
      photo: developer.photo,
      updatedAt: new Date(),
    };

    return this.developersRepository.save(updatedDeveloper);
  }

  async remove(id: string): Promise<void> {
    const developer = await this.findOne(id);

    if (developer.photo) {
      const photoPath = path.join(process.cwd(), developer.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    const gamesWithDeveloper = await this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.developers', 'developer')
      .where('developer.id = :developerId', { developerId: id })
      .getMany();

    for (const game of gamesWithDeveloper) {
      game.developers = game.developers.filter(
        (linkedDeveloper) => linkedDeveloper.id !== id,
      );
    }

    if (gamesWithDeveloper.length > 0) {
      await this.gamesRepository.save(gamesWithDeveloper);
    }

    await this.developersRepository.delete(id);
  }

  async getStats(): Promise<{ total: number }> {
    const total = await this.developersRepository.count();

    return { total };
  }

  async searchByName(query: string): Promise<Developer[]> {
    return this.developersRepository
      .createQueryBuilder('developer')
      .where('LOWER(developer.fullName) LIKE LOWER(:query)', {
        query: `%${query}%`,
      })
      .orderBy('developer.fullName', 'ASC')
      .limit(10)
      .getMany();
  }
}
