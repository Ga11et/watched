# Руководство по производительности Watched

## 🎯 Цели производительности

- **Backend**: <200ms response time для большинства запросов
- **Frontend**: <3s First Contentful Paint
- **Database**: <50ms для простых запросов
- **Mobile**: Оптимизация для медленных соединений

## 🚀 Оптимизации Backend

### 1. База данных

#### Индексы

```sql
-- Критически важные индексы
CREATE INDEX CONCURRENTLY idx_movies_watched_at ON movies(watched_at DESC);
CREATE INDEX CONCURRENTLY idx_movies_rating ON movies(rating DESC NULLS LAST);
CREATE INDEX CONCURRENTLY idx_movies_created_at ON movies(created_at DESC);
CREATE INDEX CONCURRENTLY idx_movies_director_id ON movies(director_id);

CREATE INDEX CONCURRENTLY idx_games_completion_date ON games(completion_date DESC);
CREATE INDEX CONCURRENTLY idx_games_rating ON games(rating DESC NULLS LAST);

CREATE INDEX CONCURRENTLY idx_series_watched_at ON series(watched_at DESC);
CREATE INDEX CONCURRENTLY idx_series_rating ON series(rating DESC NULLS LAST);
```

#### Оптимизация запросов

```typescript
// Плохо: N+1 проблема
const movies = await this.moviesRepository.find()
for (const movie of movies) {
  movie.director = await this.directorsRepository.findOne(movie.directorId)
}

// Хорошо: JOIN запрос
const movies = await this.moviesRepository
  .createQueryBuilder('movie')
  .leftJoinAndSelect('movie.director', 'director')
  .getMany()
```

#### Query оптимизация

```typescript
// Использовать select для конкретных полей
const movies = await this.repository
  .createQueryBuilder('movie')
  .select(['movie.id', 'movie.title', 'movie.watchedAt'])
  .where('movie.watchedAt >= :date', { date: startOfMonth })
  .orderBy('movie.watchedAt', 'DESC')
  .limit(10)
  .getMany()
```

### 2. Кэширование

#### Redis для частых запросов

```typescript
import { Cache } from 'cache-manager'

@Injectable()
export class MoviesService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private moviesRepository: Repository<Movie>,
  ) {}

  async getStats(): Promise<MovieStats> {
    const cacheKey = 'movie_stats'
    let stats = await this.cacheManager.get<MovieStats>(cacheKey)

    if (!stats) {
      stats = await this.calculateStats()
      await this.cacheManager.set(cacheKey, stats, 300) // 5 минут
    }

    return stats
  }
}
```

#### Кэширование TMDB API

```typescript
@Injectable()
export class TmdbService {
  async searchMovies(query: string): Promise<TmdbMovie[]> {
    const cacheKey = `tmdb_movies_${query}`
    const cached = await this.cacheManager.get<TmdbMovie[]>(cacheKey)

    if (cached) {
      return cached
    }

    const results = await this.httpService.get('/search/movie', {
      params: { query, language: 'ru-RU' },
    })

    await this.cacheManager.set(cacheKey, results.data.results, 86400) // 24 часа
    return results.data.results
  }
}
```

### 3. Агрегация запросов

#### Dashboard оптимизация

```typescript
// Плохо: 8 отдельных запросов
const movies = await this.moviesService.find();
const games = await this.gamesService.find();
const series = await this.seriesService.find();
// ...

// Хорошо: один агрегированный запрос
@Get('dashboard')
async getDashboard() {
  const query = `
    SELECT
      (SELECT COUNT(*) FROM movies) as movies_total,
      (SELECT COUNT(*) FROM movies WHERE watched_at >= ?) as movies_this_month,
      (SELECT AVG(rating) FROM movies WHERE rating IS NOT NULL) as movies_avg_rating,
      (SELECT COUNT(*) FROM games) as games_total,
      (SELECT COUNT(*) FROM games WHERE completion_date >= ?) as games_this_month,
      (SELECT AVG(rating) FROM games WHERE rating IS NOT NULL) as games_avg_rating
  `;

  return this.repository.query(query, [startOfMonth, startOfMonth]);
}
```

### 4. Пагинация и лимиты

```typescript
@Get()
findAll(
  @Query('page', ParseIntPipe) page = 1,
  @Query('limit', ParseIntPipe) limit = 20,
) {
  return this.repository.find({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' },
  });
}
```

## 🎨 Оптимизации Frontend

### 1. Кэширование данных

#### React Query pattern в Nuxt

```typescript
// composables/useMovies.ts
export const useMovies = () => {
  const { data: movies, refresh } = useAsyncData('movies', () => $fetch('/api/movies'), {
    server: true,
    default: () => [],
    transform: (data: Movie[]) =>
      data.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()),
  })

  return { movies, refresh }
}
```

#### Локальное кэширование

```typescript
// Использовать localStorage для кэша
const cachedData = localStorage.getItem('tmdb_cache')
if (cachedData) {
  const { data, timestamp } = JSON.parse(cachedData)
  if (Date.now() - timestamp < 86400000) {
    // 24 часа
    return data
  }
}
```

### 2. Lazy loading

#### Компоненты

```typescript
// Ленивая загрузка тяжёлых компонентов
const TmdbSearch = defineAsyncComponent(() => import('~/components/TmdbSearch.vue'))

const MovieCard = defineAsyncComponent({
  loader: () => import('~/components/MovieCard.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200,
})
```

#### Изображения

```vue
<template>
  <NuxtImg
    :src="movie.poster"
    :alt="movie.title"
    width="300"
    height="450"
    format="webp"
    loading="lazy"
  />
</template>
```

### 3. Оптимизация рендеринга

#### Virtual scrolling

```vue
<template>
  <div class="virtual-list" style="height: 600px; overflow: auto">
    <div v-for="item in visibleItems" :key="item.id" :style="{ height: itemHeight + 'px' }">
      <MovieCard :movie="item" />
    </div>
  </div>
</template>

<script setup>
const { visibleItems, containerProps } = useVirtualList(items, {
  itemHeight: 200,
  overscan: 5,
})
</script>
```

#### Debounce для поиска

```typescript
const searchQuery = ref('')
const debouncedQuery = refDebounced(searchQuery, 300)

watch(debouncedQuery, (newQuery) => {
  if (newQuery.length >= 2) {
    searchMovies(newQuery)
  }
})
```

### 4. Code splitting

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/'],
    },
  },
  experimental: {
    payloadExtraction: false,
  },
})
```

## 📊 Мониторинг производительности

### 1. Backend метрики

```typescript
// Middleware для логирования времени ответа
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now()

    res.on('finish', () => {
      const duration = Date.now() - start
      console.log(`${req.method} ${req.url} - ${duration}ms`)

      if (duration > 1000) {
        // Логировать медленные запросы
        logger.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`)
      }
    })

    next()
  }
}
```

### 2. Frontend метрики

```typescript
// Web Vitals мониторинг
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

### 3. Database мониторинг

```typescript
// Логирование медленных запросов
@Injectable()
export class DatabaseLogger implements Logger {
  logQuery(query: string, parameters?: any[]) {
    const start = Date.now()

    return {
      query,
      parameters,
      onLog: () => {
        const duration = Date.now() - start
        if (duration > 100) {
          console.warn(`Slow DB query (${duration}ms):`, query)
        }
      },
    }
  }
}
```

## 🔧 Инструменты оптимизации

### 1. Анализ производительности

```bash
# Backend
npm install clinic

# Анализ CPU
clinic doctor -- node dist/main.js

# Анализ памяти
clinic bubbleprof -- node dist/main.js

# Frontend
npm install --save-dev lighthouse
lighthouse http://localhost:33000 --output html --output-path ./lighthouse-report.html
```

### 2. Профилирование БД

```sql
-- Анализ медленных запросов PostgreSQL
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Проверка индексов
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'movies';
```

### 3. Network оптимизация

```typescript
// Сжатие ответов
import * as compression from 'compression'

app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false
      }
      return compression.filter(req, res)
    },
    level: 6,
    threshold: 1024,
  }),
)
```

## 📈 Целевые метрики

### Response times

- **API endpoints**: <200ms (95th percentile)
- **Database queries**: <50ms (average)
- **TMDB API**: <500ms (with cache)

### Frontend metrics

- **FCP**: <1.5s
- **LCP**: <2.5s
- **FID**: <100ms
- **CLS**: <0.1

### Resource usage

- **Memory**: <512MB (Node.js)
- **CPU**: <50% (average)
- **Bundle size**: <500KB (gzipped)

## 🚨 Частые проблемы

### 1. N+1 запросы

**Проблема**: Загрузка связанных данных в цикле
**Решение**: Использовать JOIN или eager loading

### 2. Отсутствие кэширования

**Проблема**: Повторные запросы к внешним API
**Решение**: Redis кэш с TTL

### 3. Большие payloads

**Проблема**: Отправка лишних данных
**Решение**: Select конкретных полей, пагинация

### 4. Медленный фронтенд

**Проблема**: Большие bundle sizes
**Решение**: Code splitting, lazy loading, оптимизация изображений
