import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Publisher } from './entities/publisher.entity';
import { CreatePublisherDto } from './dto/create-publisher.dto';
import { UpdatePublisherDto } from './dto/update-publisher.dto';
import { Game } from '../games/entities/game.entity';

@Injectable()
export class PublishersService {
  private readonly uploadPath = path.join(
    process.cwd(),
    'uploads',
    'publishers',
  );

  constructor(
    @InjectRepository(Publisher)
    private publishersRepository: Repository<Publisher>,
    @InjectRepository(Game)
    private gamesRepository: Repository<Game>,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async create(
    createPublisherDto: CreatePublisherDto,
    photo?: Express.Multer.File,
  ): Promise<Publisher> {
    if (!createPublisherDto.fullName?.trim()) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при создании издателя',
        violations: [
          {
            field: 'fullName',
            message: 'Название издателя обязательно',
          },
        ],
      });
    }

    let photoPath: string | null = null;

    if (photo) {
      const fileName = `${Date.now()}-${photo.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, photo.buffer);
      photoPath = `/uploads/publishers/${fileName}`;
    }

    const publisher = this.publishersRepository.create({
      ...createPublisherDto,
      photo: photoPath,
    });

    return this.publishersRepository.save(publisher);
  }

  async findAll(
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
    limit?: string,
  ): Promise<Publisher[]> {
    const queryBuilder =
      this.publishersRepository.createQueryBuilder('publisher');

    if (sortBy) {
      const validSortFields = ['fullName', 'createdAt'];
      if (validSortFields.includes(sortBy)) {
        queryBuilder.orderBy(`publisher.${sortBy}`, sortOrder || 'ASC');
      }
    } else {
      queryBuilder.orderBy('publisher.fullName', 'ASC');
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        queryBuilder.limit(limitNum);
      }
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Publisher> {
    const publisher = await this.publishersRepository.findOne({
      where: { id },
      relations: {
        games: true,
      },
    });

    if (!publisher) {
      throw new NotFoundException(`Издатель с ID ${id} не найден`);
    }

    return publisher;
  }

  async update(
    id: string,
    updatePublisherDto: UpdatePublisherDto,
    photo?: Express.Multer.File,
  ): Promise<Publisher> {
    if (
      updatePublisherDto.fullName !== undefined &&
      !updatePublisherDto.fullName?.trim()
    ) {
      throw new UnprocessableEntityException({
        message: 'Произошла ошибка при обновлении издателя',
        violations: [
          {
            field: 'fullName',
            message: 'Название издателя не может быть пустым',
          },
        ],
      });
    }

    const publisher = await this.findOne(id);

    if (publisher.photo && (updatePublisherDto.removePhoto || photo)) {
      const oldPhotoPath = path.join(process.cwd(), publisher.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
      publisher.photo = null;
    }

    if (photo) {
      const fileName = `${Date.now()}-${photo.originalname}`;
      const filePath = path.join(this.uploadPath, fileName);
      fs.writeFileSync(filePath, photo.buffer);
      publisher.photo = `/uploads/publishers/${fileName}`;
    }

    const updatedPublisher = {
      ...publisher,
      ...updatePublisherDto,
      photo: publisher.photo,
      updatedAt: new Date(),
    };

    return this.publishersRepository.save(updatedPublisher);
  }

  async remove(id: string): Promise<void> {
    const publisher = await this.findOne(id);

    if (publisher.photo) {
      const photoPath = path.join(process.cwd(), publisher.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    const gamesWithPublisher = await this.gamesRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.publishers', 'publisher')
      .where('publisher.id = :publisherId', { publisherId: id })
      .getMany();

    for (const game of gamesWithPublisher) {
      game.publishers = game.publishers.filter(
        (linkedPublisher) => linkedPublisher.id !== id,
      );
    }

    if (gamesWithPublisher.length > 0) {
      await this.gamesRepository.save(gamesWithPublisher);
    }

    await this.publishersRepository.delete(id);
  }

  async getStats(): Promise<{ total: number }> {
    const total = await this.publishersRepository.count();

    return { total };
  }

  async searchByName(query: string): Promise<Publisher[]> {
    return this.publishersRepository
      .createQueryBuilder('publisher')
      .where('LOWER(publisher.fullName) LIKE LOWER(:query)', {
        query: `%${query}%`,
      })
      .orderBy('publisher.fullName', 'ASC')
      .limit(10)
      .getMany();
  }
}
