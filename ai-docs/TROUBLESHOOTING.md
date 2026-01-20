# Troubleshooting Guide - Watched

## 🚨 Частые проблемы и решения

### Backend проблемы

#### 1. База данных не подключается

**Симптомы:**

```
Error: connect ECONNREFUSED 127.0.0.1:5433
```

**Решения:**

```bash
# Проверить статус PostgreSQL
sudo systemctl status postgresql

# Запустить PostgreSQL
sudo systemctl start postgresql

# Проверить порт
netstat -tlnp | grep 5433

# Создать базу данных
createdb -h 127.0.0.1 -p 5433 -U watched watched
```

**Проверить .env файл:**

```bash
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USER=watched
DB_PASSWORD=watched
DB_NAME=watched
```

#### 2. Migration ошибки

**Симптомы:**

```
Error: No migration selected to run
```

**Решения:**

```bash
# Создать новую migration
npx typeorm migration:generate -d src/data-source.ts src/migrations/MigrationName

# Запустить migrations
npx typeorm migration:run -d src/data-source.ts

# Откатить migration
npx typeorm migration:revert -d src/data-source.ts
```

#### 3. CORS ошибки

**Симптомы:**

```
Access to fetch at 'http://localhost:33010' from origin 'http://localhost:33000' has been blocked by CORS policy
```

**Решения:**

```typescript
// src/main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:33000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
})
```

#### 4. File upload ошибки

**Симптомы:**

```
Error: ENOENT: no such file or directory, open 'uploads/movies/...'
```

**Решения:**

```bash
# Создать папку uploads
mkdir -p packages/api/uploads/movies
mkdir -p packages/api/uploads/games
mkdir -p packages/api/uploads/series

# Права доступа
chmod 755 packages/api/uploads
```

```typescript
// Проверка в service
constructor() {
  if (!fs.existsSync(this.uploadPath)) {
    fs.mkdirSync(this.uploadPath, { recursive: true });
  }
}
```

#### 5. Валидация DTO

**Симптомы:**

```
UnprocessableEntityException: Bad Request
```

**Решения:**

```typescript
// Проверить DTO классы
@IsString()
@IsNotEmpty()
title: string;

@IsNumber()
@Min(0)
@Max(100)
@IsOptional()
rating?: number;
```

### Frontend проблемы

#### 1. API запросы не работают

**Симптомы:**

```
Network Error
```

**Решения:**

```typescript
// Проверить nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:33010', // Правильный URL
    },
  },
})
```

```bash
# Проверить что API запущен
curl http://localhost:33010/movies
```

#### 2. TMDB API ошибки

**Симптомы:**

```
401 Unauthorized from TMDB API
```

**Решения:**

```bash
# Добавить API ключ в .env
NUXT_PUBLIC_TMDB_API_KEY=your_actual_tmdb_api_key
```

```typescript
// Проверить использование в компоненте
const config = useRuntimeConfig()
const TMDB_API_KEY = config.public.tmdbApiKey

if (!TMDB_API_KEY) {
  console.error('TMDB API key not configured')
}
```

#### 3. Hydration ошибки

**Симптомы:**

```
[Vue warn]: Hydration mismatch
```

**Решения:**

```vue
<template>
  <!-- Использовать v-if вместо v-show для SSR -->
  <div v-if="mounted">
    <ClientOnly>
      <HeavyComponent />
    </ClientOnly>
  </div>
</template>

<script setup>
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})
</script>
```

#### 4. Стили не применяются

**Симптомы:**

```
TailwindCSS классы не работают
```

**Решения:**

```bash
# Проверить установку Tailwind
npm install -D @nuxtjs/tailwindcss

# Проверить nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
});
```

```css
/* Проверить tailwind.config.js */
module.exports = {
  content:
    [ './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
    ];
}
```

### Производительность проблемы

#### 1. Медленная загрузка дашборда

**Симптомы:**

```
Dashboard загружается >5 секунд
```

**Решения:**

```typescript
// Оптимизировать запросы
@Get('dashboard')
async getDashboard() {
  // Один запрос вместо 8
  const query = `
    SELECT
      m.title, m.watched_at, m.rating,
      g.title, g.completion_date, g.rating,
      s.title, s.watched_at, s.rating
    FROM movies m
    UNION ALL
    SELECT g.title, g.completion_date, g.rating, null, null, null, null, null, null
    FROM games g
    ORDER BY watched_at DESC, completion_date DESC
    LIMIT 20
  `;

  return this.repository.query(query);
}
```

#### 2. Большой bundle size

**Симптомы:**

```
Bundle > 1MB
```

**Решения:**

```typescript
// Lazy loading компонентов
const HeavyComponent = defineAsyncComponent(() => import('~/components/HeavyComponent.vue'))

// Динамический импорт
const loadModule = () => import('~/utils/heavy-utils')
```

### Разработка проблемы

#### 1. Hot reload не работает

**Симптомы:**

```
Изменения не применяются автоматически
```

**Решения:**

```bash
# Перезапустить dev сервер
pnpm run dev:api
pnpm run dev:client

# Очистить кэш
rm -rf .nuxt
rm -rf node_modules/.cache
```

#### 2. TypeScript ошибки

**Симптомы:**

```
Cannot find module or type declarations
```

**Решения:**

```bash
# Переустановить зависимости
pnpm install

# Проверить tsconfig.json
{
  "compilerOptions": {
    "types": ["@nuxt/types"],
    "strict": true,
    "esModuleInterop": true
  }
}
```

#### 3. ESLint ошибки

**Симптомы:**

```
ESLint: Parsing error
```

**Решения:**

```bash
# Исправить автоматически
npx eslint . --fix

# Проверить конфиг .eslintrc.js
module.exports = {
  extends: [
    '@nuxt/eslint-config',
    'prettier'
  ],
};
```

## 🔧 Диагностика

### 1. Логирование

```typescript
// Добавить детальное логирование
import { Logger } from '@nestjs/common'

@Injectable()
export class MoviesService {
  private readonly logger = new Logger(MoviesService.name)

  async findAll() {
    this.logger.log('Fetching all movies')

    try {
      const movies = await this.repository.find()
      this.logger.log(`Found ${movies.length} movies`)
      return movies
    } catch (error) {
      this.logger.error('Error fetching movies', error.stack)
      throw error
    }
  }
}
```

### 2. Health checks

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: await this.checkDatabase(),
      memory: process.memoryUsage(),
    }
  }

  private async checkDatabase() {
    try {
      await this.repository.query('SELECT 1')
      return 'connected'
    } catch {
      return 'disconnected'
    }
  }
}
```

### 3. Отладка API

```bash
# Использовать curl для тестирования
curl -X GET http://localhost:33010/movies \
  -H "Content-Type: application/json" \
  -v

# POST запрос с файлом
curl -X POST http://localhost:33010/movies \
  -F "title=Test Movie" \
  -F "poster=@/path/to/image.jpg"
```

### 4. Browser отладка

```javascript
// В консоли браузера
// Проверить API запросы
fetch('/api/movies')
  .then((res) => res.json())
  .then((data) => console.log(data))

// Проверить localStorage
console.log(localStorage.getItem('watched_movies_view_mode'))
```

## 📊 Мониторинг

### 1. Логи

```bash
# Следить за логами в реальном времени
tail -f packages/api/logs/app.log

# Фильтровать ошибки
grep -i error packages/api/logs/app.log
```

### 2. Метрики

```typescript
// Добавить метрики производительности
@Injectable()
export class MetricsService {
  private metrics = new Map<string, number>()

  recordTime(operation: string, duration: number) {
    this.metrics.set(operation, duration)

    if (duration > 1000) {
      console.warn(`Slow operation: ${operation} took ${duration}ms`)
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }
}
```

### 3. Алерты

```typescript
// Middleware для алертов
@Injectable()
export class AlertMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now()

    res.on('finish', () => {
      const duration = Date.now() - start

      if (res.statusCode >= 500) {
        // Отправить алерт об ошибке сервера
        this.sendAlert(`Server error: ${req.method} ${req.url}`)
      }

      if (duration > 5000) {
        // Отправить алерт о медленном запросе
        this.sendAlert(`Slow request: ${req.method} ${req.url} took ${duration}ms`)
      }
    })

    next()
  }
}
```

## 🆘 Экстренные решения

### 1. Полный сброс

```bash
# Полная переустановка проекта
rm -rf node_modules
rm -rf .nuxt
rm -rf packages/api/dist
rm -rf packages/client/.nuxt

pnpm install
pnpm run build
```

### 2. База данных

```bash
# Полная переинициализация БД
dropdb -h 127.0.0.1 -p 5433 -U watched watched
createdb -h 127.0.0.1 -p 5433 -U watched watched

# Запустить migrations
npx typeorm migration:run -d src/data-source.ts
```

### 3. Возврат к рабочему состоянию

```bash
# Отменить последние изменения
git checkout -- .

# Или откатить к конкретному коммиту
git reset --hard <commit-hash>
```

## 📞 Поддержка

### Полезные команды

```bash
# Статус системы
ps aux | grep node
netstat -tlnp | grep :33010
df -h

# Проверить зависимости
pnpm list --depth=0
npm outdated

# Очистка кэша
pnpm store prune
npm cache clean --force
```

### Ссылки на документацию

- [NestJS Documentation](https://docs.nestjs.com/)
- [Nuxt 3 Documentation](https://nuxt.com/docs/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
