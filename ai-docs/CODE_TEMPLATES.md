# Шаблоны кода для агента

## 1. Создание новой сущности

### Entity (entities/new-entity.entity.ts)

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class NewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ nullable: true, type: 'text' })
  description: string | null

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date
}
```

### DTO (dto/create-new-entity.dto.ts)

```typescript
import { IsString, IsOptional } from 'class-validator'

export class CreateNewEntityDto {
  @IsString()
  title: string

  @IsString()
  @IsOptional()
  description?: string
}
```

### Service (new-entity.service.ts)

```typescript
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { NewEntity } from './entities/new-entity.entity'

@Injectable()
export class NewEntityService {
  constructor(
    @InjectRepository(NewEntity)
    private newEntityRepository: Repository<NewEntity>,
  ) {}

  create(createNewEntityDto: CreateNewEntityDto): Promise<NewEntity> {
    const newEntity = this.newEntityRepository.create(createNewEntityDto)
    return this.newEntityRepository.save(newEntity)
  }

  findAll(): Promise<NewEntity[]> {
    return this.newEntityRepository.find()
  }

  findOne(id: string): Promise<NewEntity> {
    return this.newEntityRepository.findOne({ where: { id } })
  }

  update(id: string, updateNewEntityDto: UpdateNewEntityDto): Promise<NewEntity> {
    return this.newEntityRepository.save({ id, ...updateNewEntityDto })
  }

  remove(id: string): Promise<void> {
    return this.newEntityRepository.delete(id)
  }
}
```

### Controller (new-entity.controller.ts)

```typescript
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common'
import { NewEntityService } from './new-entity.service'
import { CreateNewEntityDto } from './dto/create-new-entity.dto'

@Controller('new-entities')
export class NewEntityController {
  constructor(private readonly newEntityService: NewEntityService) {}

  @Post()
  create(@Body() createNewEntityDto: CreateNewEntityDto) {
    return this.newEntityService.create(createNewEntityDto)
  }

  @Get()
  findAll() {
    return this.newEntityService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.newEntityService.findOne(id)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateNewEntityDto: UpdateNewEntityDto) {
    return this.newEntityService.update(id, updateNewEntityDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.newEntityService.remove(id)
  }
}
```

## 2. Добавление нового поля в существующую сущность

### Шаг 1: Обновить entity

```typescript
@Column({ nullable: true, type: 'int' })
newField: number | null;
```

### Шаг 2: Обновить DTO

```typescript
@IsNumber()
@IsOptional()
newField?: number;
```

### Шаг 3: Обновить frontend интерфейс

```typescript
// В компоненте формы добавить новое поле
<input v-model="form.newField" type="number" placeholder="Новое поле" />
```

## 3. Создание статистического endpoint

```typescript
@Get('stats')
async getStats(): Promise<{ total: number; thisMonth: number; avgRating: number }> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, thisMonth, avgRatingResult] = await Promise.all([
    this.repository.count(),
    this.repository.count({
      where: { createdAt: MoreThanOrEqual(startOfMonth) },
    }),
    this.repository
      .createQueryBuilder('entity')
      .select('AVG(entity.rating)', 'avgRating')
      .where('entity.rating IS NOT NULL')
      .getRawOne<{ avgRating?: string }>(),
  ]);

  return {
    total,
    thisMonth,
    avgRating: avgRatingResult?.avgRating ? parseFloat(avgRatingResult.avgRating) : 0,
  };
}
```

## 4. Фронтенд компонент для отображения списка

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div
      v-for="item in items"
      :key="item.id"
      class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ item.title }}</h3>
      <p v-if="item.description" class="text-gray-600 text-sm mb-4">{{ item.description }}</p>
      <div class="flex justify-between items-center">
        <span class="text-xs text-gray-500">{{ formatDate(item.createdAt) }}</span>
        <div class="flex gap-2">
          <NuxtLink
            :to="`/${entityName}/${item.id}/edit`"
            class="text-indigo-600 hover:text-indigo-800"
          >
            Редактировать
          </NuxtLink>
          <button @click="deleteItem(item.id)" class="text-red-600 hover:text-red-800">
            Удалить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps<{
  items: any[]
  entityName: string
}>()

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU')
}

const deleteItem = async (id) => {
  if (confirm('Вы уверены?')) {
    await $fetch(`/api/${props.entityName}/${id}`, { method: 'DELETE' })
    // Обновить список
  }
}
</script>
```
