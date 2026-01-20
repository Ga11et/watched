# Процесс разработки бэкенда в проекте Watched

## Обзор

Документ описывает стандартный процесс разработки нового функционала на стороне бэкенда, основанный на методологии TDD (Test-Driven Development) и следующих принципах: документация → тесты → реализация.

---

## Шаг 1: Изучение имеющейся документации

### 1.1. Анализ архитектуры проекта

- Изучить `ai-docs/ARCHITECTURE.md` для понимания общей структуры
- Ознакомиться с `ai-docs/agent-context.md` для понимания паттернов и правил
- Просмотреть существуюущие сущности и их взаимосвязи

### 1.2. Изучение существующего кода

```bash
# Найти похожие сущности для примера
find packages/api/src -name "*.service.ts" | head -5
find packages/api/src -name "*.entity.ts" | head -5
```

### 1.3. Анализ API контрактов

- Изучить `packages/client/types/api.ts` для понимание ожидаемых интерфейсов
- Проверить существующие DTO и валидацию
- Понять паттерны ответов API

### 1.4. Изучение миграций БД

```bash
# Посмотреть последние миграции для понимания паттернов
ls packages/api/src/migrations/ | tail -10
```

---

## Шаг 2: Составление тестов

### 2.1. Подготовка тестовой среды

```bash
# Создать тестовые файлы
touch packages/api/src/[entity]/[entity].service.spec.ts
touch packages/api/src/[entity]/[entity].controller.spec.ts
```

### 2.2. Написание unit тестов для сервиса

```typescript
// Пример структуры тестов
describe('[Entity]Service', () => {
  let service: [Entity]Service;
  let repository: Repository<[Entity]>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        [Entity]Service,
        {
          provide: getRepositoryToken([Entity]),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<[Entity]Service>([Entity]Service);
    repository = module.get<Repository<[Entity]>>(getRepositoryToken([Entity]));
  });

  describe('create', () => {
    it('should create entity successfully', async () => {
      // Arrange
      const createDto = { /* test data */ };
      const expectedResult = { /* expected result */ };

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should throw validation error for invalid data', async () => {
      // Test validation scenarios
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      // Test pagination
    });

    it('should apply filters correctly', async () => {
      // Test filtering
    });
  });

  describe('findOne', () => {
    it('should return entity by id', async () => {
      // Test successful retrieval
    });

    it('should throw NotFoundException for non-existent entity', async () => {
      // Test error handling
    });
  });

  describe('update', () => {
    it('should update entity successfully', async () => {
      // Test update functionality
    });
  });

  describe('remove', () => {
    it('should remove entity successfully', async () => {
      // Test deletion
    });
  });
});
```

### 2.3. Написание integration тестов для контроллера

```typescript
describe('[Entity]Controller', () => {
  let controller: [Entity]Controller;
  let service: [Entity]Service;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [[Entity]Controller],
      providers: [
        {
          provide: [Entity]Service,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<[Entity]Controller>([Entity]Controller);
    service = module.get<[Entity]Service>([Entity]Service);
  });

  describe('POST /entities', () => {
    it('should create entity', async () => {
      // Test endpoint creation
    });

    it('should validate input data', async () => {
      // Test validation
    });
  });

  describe('GET /entities', () => {
    it('should return paginated list', async () => {
      // Test listing
    });
  });

  describe('GET /entities/:id', () => {
    it('should return entity by id', async () => {
      // Test retrieval
    });
  });

  describe('PATCH /entities/:id', () => {
    it('should update entity', async () => {
      // Test update
    });
  });

  describe('DELETE /entities/:id', () => {
    it('should delete entity', async () => {
      // Test deletion
    });
  });
});
```

### 2.4. E2E тесты (опционально)

```typescript
describe('[Entity] E2E', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  describe('/entities (POST)', () => {
    it('should create entity and return 201', () => {
      return request(app.getHttpServer())
        .post('/entities')
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject(expectedResponse)
        })
    })
  })
})
```

---

## Шаг 3: Написание кода до прохождения тестов

### 3.1. Создание entity

```typescript
// packages/api/src/[entity]/[entity].entity.ts
@Entity('[entity]')
export class [Entity] extends BaseEntity {
  @Column()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  @IsNumber()
  @Min(0)
  @Max(100)
  rating: number;

  // Relations
  @ManyToOne(() => RelatedEntity, (related) => related.entities)
  @JoinColumn({ name: 'relatedEntityId' })
  relatedEntity: RelatedEntity;
}
```

### 3.2. Создание DTO

```typescript
// packages/api/src/[entity]/dto/create-[entity].dto.ts
export class Create[Entity]Dto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  rating: number;

  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;
}

// packages/api/src/[entity]/dto/update-[entity].dto.ts
export class Update[Entity]Dto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  rating?: number;
}
```

### 3.3. Создание query DTO

```typescript
// packages/api/src/[entity]/dto/query-[entity].dto.ts
export class Query[Entity]Dto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
```

### 3.4. Реализация сервиса

```typescript
// packages/api/src/[entity]/[entity].service.ts
@Injectable()
export class [Entity]Service {
  constructor(
    @InjectRepository([Entity])
    private readonly [entity]Repository: Repository<[Entity]>,
  ) {}

  async create(create[Entity]Dto: Create[Entity]Dto): Promise<[Entity]> {
    const entity = this.[entity]Repository.create(create[Entity]Dto);
    return await this.[entity]Repository.save(entity);
  }

  async findAll(query: Query[Entity]Dto): Promise<PaginatedResult<[Entity]>> {
    const { page, limit, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.[entity]Repository
      .createQueryBuilder('[entity]')
      .leftJoinAndSelect('[entity].relatedEntity', 'relatedEntity');

    if (search) {
      queryBuilder.where('[entity].name ILIKE :search', { search: `%${search}%` });
    }

    queryBuilder
      .orderBy(`[entity].${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<[Entity]> {
    const entity = await this.[entity]Repository.findOne({
      where: { id },
      relations: ['relatedEntity'],
    });

    if (!entity) {
      throw new NotFoundException(`[Entity] with id ${id} not found`);
    }

    return entity;
  }

  async update(id: string, update[Entity]Dto: Update[Entity]Dto): Promise<[Entity]> {
    const entity = await this.findOne(id);
    Object.assign(entity, update[Entity]Dto);
    return await this.[entity]Repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    await this.[entity]Repository.remove(entity);
  }
}
```

### 3.5. Реализация контроллера

```typescript
// packages/api/src/[entity]/[entity].controller.ts
@Controller('[entities]')
@ApiTags('[Entities]')
export class [Entity]Controller {
  constructor(private readonly [entity]Service: [Entity]Service) {}

  @Post()
  @ApiOperation({ summary: 'Create new entity' })
  @ApiResponse({ status: 201, description: 'Entity created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() create[Entity]Dto: Create[Entity]Dto): Promise<[Entity]> {
    return this.[entity]Service.create(create[Entity]Dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all entities with pagination' })
  @ApiResponse({ status: 200, description: 'List of entities' })
  findAll(@Query() query: Query[Entity]Dto): Promise<PaginatedResult<[Entity]>> {
    return this.[entity]Service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entity by id' })
  @ApiResponse({ status: 200, description: 'Entity found' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  findOne(@Param('id') id: string): Promise<[Entity]> {
    return this.[entity]Service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update entity' })
  @ApiResponse({ status: 200, description: 'Entity updated successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  update(
    @Param('id') id: string,
    @Body() update[Entity]Dto: Update[Entity]Dto,
  ): Promise<[Entity]> {
    return this.[entity]Service.update(id, update[Entity]Dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete entity' })
  @ApiResponse({ status: 204, description: 'Entity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.[entity]Service.remove(id);
  }
}
```

### 3.6. Создание модуля

```typescript
// packages/api/src/[entity]/[entity].module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [[Entity]Controller],
  providers: [[Entity]Service],
  exports: [[Entity]Service],
})
export class [Entity]Module {}
```

### 3.7. Создание миграции

```bash
# Создать миграцию
npm run migration:generate -- --name Create[Entity]Table
```

```typescript
// packages/api/src/migrations/xxxxxxxxxxxxxx-Create[Entity]Table.ts
export class Create[Entity]Table implements MigrationInterface {
  name = 'Create[Entity]Table';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: '[entity]',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 1,
          },
          {
            name: 'relatedEntityId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['relatedEntityId'],
            referencedTableName: 'related_entity',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          {
            name: 'IDX_[ENTITY]_NAME',
            columnNames: ['name'],
          },
          {
            name: 'IDX_[ENTITY]_RATING',
            columnNames: ['rating'],
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('[entity]');
  }
}
```

### 3.8. Регистрация модуля

```typescript
// packages/api/src/app.module.ts
@Module({
  imports: [
    // ... другие модули
    [Entity]Module,
  ],
})
export class AppModule {}
```

---

## Шаг 4: Запуск тестов и отладка

### 4.1. Запуск тестов

```bash
# Запустить все тесты
npm run test

# Запустить тесты для конкретной сущности
npm run test -- [entity]

# Запустить тесты с покрытием
npm run test:cov

# Запустить тесты в watch режиме
npm run test:watch
```

### 4.2. Анализ результатов

- Все тесты должны проходить
- Покрытие кода должно быть > 80%
- Фиксация failing тестов перед продолжением

### 4.3. Итеративная разработка

```bash
# Цикл разработки
1. Написать failing тест
2. Написать минимальный код для прохождения теста
3. Рефакторинг (если нужно)
4. Повторять пока все тесты не пройдут
```

---

## Шаг 5: Валидация и документирование

### 5.1. Проверка API документации

```bash
# Запустить приложение и проверить Swagger UI
npm run start:dev
# Открыть http://localhost:33010/api
```

### 5.2. Обновление типов на фронтенде

```typescript
// packages/client/types/api.ts
export interface [Entity] extends BaseEntity {
  name: string;
  description?: string;
  rating: number;
  relatedEntity?: RelatedEntity;
}
```

### 5.3. Обновление документации проекта

- Добавить новую сущность в `ai-docs/agent-context.md`
- Обновить `ai-docs/ARCHITECTURE.md` если изменилась архитектура
- Добавить примеры использования в документацию

---

## Best Practices

### Тестирование

- **Red-Green-Refactor**: Сначала failing тест, потом проходящий, потом рефакторинг
- **AAA Pattern**: Arrange, Act, Assert структура тестов
- **Изоляция**: Каждый тест должен быть независимым
- **Покрытие**: Стремиться к > 80% покрытию кода

### Код

- **SOLID принципы**: Единственная ответственность, открытость/закрытость
- **DRY**: Don't Repeat Yourself
- **Валидация**: Всегда валидировать входные данные
- **Обработка ошибок**: Правильные HTTP статусы и сообщения

### Производительность

- **Индексы**: Добавлять индексы для частых запросов
- **Relations**: Использовать `leftJoinAndSelect` оптимально
- **Пагинация**: Всегда ограничивать количество результатов

---

## Полезные команды

```bash
# Создание новой сущности (шаблон)
npm run entity:generate [EntityName]

# Запуск миграций
npm run migration:run

# Откат миграций
npm run migration:revert

# Проверка типов TypeScript
npm run type-check

# Линтинг кода
npm run lint

# Форматирование кода
npm run format
```

---

## Заключение

Следование этому процессу обеспечивает:

- **Качество кода** через тестирование
- **Консистентность** через паттерны
- **Поддерживаемость** через документацию
- **Надёжность** через валидацию и обработку ошибок

Каждый шаг важен и не должен пропускаться для обеспечения стабильной и предсказуемой разработки.
