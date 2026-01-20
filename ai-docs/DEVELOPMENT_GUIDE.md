# Руководство по разработке Watched

## 🚀 Начало работы

### 1. Настройка окружения

```bash
# Установка зависимостей
pnpm install

# Запуск разработки
pnpm run dev:api    # Backend на порту 33010
pnpm run dev:client # Frontend на порту 33000
```

### 2. Переменные окружения

```bash
# .env в packages/client
NUXT_PUBLIC_API_BASE=http://localhost:33010
NUXT_PUBLIC_TMDB_API_KEY=your_tmdb_key

# .env в packages/api
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=watched
DB_PASSWORD=watched
DB_NAME=watched
```

## 📁 Структура проекта

### Backend (packages/api)

```
src/
├── app.module.ts          # Корневой модуль
├── main.ts                # Точка входа
├── movies/                # Модуль фильмов
│   ├── entities/          # Entity модели
│   ├── dto/              # DTO для валидации
│   ├── service.ts        # Бизнес-логика
│   └── controller.ts     # Эндпоинты API
├── games/                 # Модуль игр
├── series/                # Модуль сериалов
└── directors/             # Модуль режиссёров
```

### Frontend (packages/client)

```
├── pages/                 # Страницы (автоматическая маршрутизация)
├── components/            # Vue компоненты
├── types/                 # TypeScript типы
├── composables/          # Composables
└── nuxt.config.ts        # Конфигурация Nuxt
```

## 🏗️ Паттерны разработки

### 1. Создание новой сущности

**Шаг 1: Entity**

```typescript
// src/new-entity/entities/new-entity.entity.ts
@Entity()
export class NewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  title: string

  @Column({ nullable: true, type: 'timestamp' })
  createdAt: Date
}
```

**Шаг 2: DTO**

```typescript
// src/new-entity/dto/create-new-entity.dto.ts
export class CreateNewEntityDto {
  @IsString()
  title: string
}
```

**Шаг 3: Service**

```typescript
// src/new-entity/new-entity.service.ts
@Injectable()
export class NewEntityService {
  constructor(
    @InjectRepository(NewEntity)
    private repository: Repository<NewEntity>,
  ) {}
}
```

**Шаг 4: Controller**

```typescript
// src/new-entity/new-entity.controller.ts
@Controller('new-entities')
export class NewEntityController {
  constructor(private service: NewEntityService) {}
}
```

**Шаг 5: Module**

```typescript
// src/new-entity/new-entity.module.ts
@Module({
  controllers: [NewEntityController],
  providers: [NewEntityService],
  exports: [NewEntityService],
})
export class NewEntityModule {}
```

**Шаг 6: Регистрация**

```typescript
// src/app.module.ts
import { NewEntityModule } from './new-entity/new-entity.module'

@Module({
  imports: [NewEntityModule],
})
export class AppModule {}
```

### 2. Фронтенд компонент

**Страница списка**

```vue
<!-- pages/new-entities/index.vue -->
<template>
  <div>
    <h1>New Entities</h1>
    <div v-if="pending">Loading...</div>
    <div v-else>
      <div v-for="item in items" :key="item.id">
        {{ item.title }}
      </div>
    </div>
  </div>
</template>

<script setup>
const { data: items, pending } = await useAsyncData('new-entities', () =>
  $fetch('/api/new-entities'),
)
</script>
```

**Страница создания**

```vue
<!-- pages/new-entities/new.vue -->
<template>
  <form @submit.prevent="submit">
    <input v-model="form.title" placeholder="Title" required />
    <button type="submit">Create</button>
  </form>
</template>

<script setup>
const form = ref({ title: '' })

const submit = async () => {
  await $fetch('/api/new-entities', {
    method: 'POST',
    body: form.value,
  })
  await navigateTo('/new-entities')
}
</script>
```

## 🔧 Частые задачи

### Добавление нового поля в сущность

1. Обновить `entity.ts`
2. Обновить `dto/*.ts`
3. Обновить миграцию БД
4. Обновить фронтенд формы

### Создание статистического endpoint

```typescript
@Get('stats')
async getStats() {
  const [total, thisMonth] = await Promise.all([
    this.repository.count(),
    this.repository.count({
      where: { createdAt: MoreThanOrEqual(startOfMonth) },
    }),
  ]);
  return { total, thisMonth };
}
```

### Интеграция с внешним API

```typescript
@Injectable()
export class ExternalApiService {
  async fetchData(query: string) {
    return this.httpService.get('https://api.example.com/search', {
      params: { q: query },
    })
  }
}
```

## 🎨 UI/UX паттерны

### Компоненты

- Использовать TailwindCSS классы
- Следовать дизайн-системе проекта
- Адаптивный дизайн (mobile-first)

### Формы

- Валидация на клиенте и сервере
- Индикация загрузки
- Обработка ошибок

### Навигация

- Хлебные крошки
- Кнопки "назад"
- Плавные переходы

## 📝 Правила кода

### Backend

- Использовать TypeScript
- Валидация через class-validator
- Обработка ошибок NestJS
- Логирование операций

### Frontend

- Vue 3 Composition API
- TypeScript для типизации
- Nuxt 3 лучшие практики
- Оптимизация изображений

### База данных

- UUID для primary keys
- Индексы для частых запросов
- Мягкое удаление при необходимости
- Timestamps для аудита

## 🧪 Тестирование

### Unit тесты

```bash
# Запуск тестов
pnpm test
pnpm test:watch
pnpm test:cov
```

### E2E тесты

```bash
# Запуск E2E тестов
pnpm test:e2e
```

## 🚀 Развертывание

### Production

```bash
# Сборка
pnpm run build

# Запуск
pnpm run start:prod
```

### Docker

```bash
# Запуск через Docker Compose
docker-compose up -d
```

## 🔍 Отладка

### Backend

- Использовать логирование
- Debugger в VS Code
- Postman для тестирования API

### Frontend

- Vue DevTools
- Network tab в браузере
- Console для ошибок

## 📚 Полезные ресурсы

- [NestJS Documentation](https://docs.nestjs.com/)
- [Nuxt 3 Documentation](https://nuxt.com/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
