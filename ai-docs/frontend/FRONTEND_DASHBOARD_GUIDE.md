# Документация: Страница Dashboard

## Обзор

Dashboard является главной страницей приложения, которая предоставляет обзор всей коллекции медиа-контента. Страница отображает статистику по всем сущностям и последние добавленные элементы.

## Структура Dashboard

### 1. Основной шаблон

```vue
<template>
  <div>
    <!-- Блок ошибок -->
    <div v-if="error" class="error-block">Не удалось загрузить данные дашборда</div>

    <!-- Индикатор загрузки -->
    <div v-if="pending" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка дашборда...</p>
    </div>

    <!-- Основной контент -->
    <div v-else-if="dashboardData">
      <!-- Статистика -->
      <StatsOverview :stats="dashboardData.stats" />

      <!-- Последний контент -->
      <RecentContent :data="dashboardData" />
    </div>
  </div>
</template>
```

### 2. Script секция

```vue
<script setup>
const config = useRuntimeConfig()

// Загрузка данных дашборда
const {
  data: dashboardData,
  pending,
  error,
} = await useAsyncData('dashboard', async () => {
  try {
    // Параллельная загрузка последних элементов
    const [moviesResponse, gamesResponse, booksResponse, seriesResponse] = await Promise.all([
      $fetch(`${config.public.apiBase}/movies?limit=5`),
      $fetch(`${config.public.apiBase}/games?limit=5`),
      $fetch(`${config.public.apiBase}/books?limit=5`),
      $fetch(`${config.public.apiBase}/series?limit=5`),
    ])

    // Параллельная загрузка статистики
    const [allMovies, allGames, allBooks, allSeries] = await Promise.all([
      $fetch(`${config.public.apiBase}/movies/stats`),
      $fetch(`${config.public.apiBase}/games/stats`),
      $fetch(`${config.public.apiBase}/books/stats`),
      $fetch(`${config.public.apiBase}/series/stats`),
    ])

    return {
      recentMovies: moviesResponse.data || [],
      recentGames: gamesResponse.data || [],
      recentBooks: booksResponse.data || [],
      recentSeries: seriesResponse.data || [],
      stats: {
        movies: allMovies,
        games: allGames,
        books: allBooks,
        series: allSeries,
      },
    }
  } catch (e) {
    console.error('Dashboard data fetch error:', e)
    return getDefaultData()
  }
})

// Вспомогательные функции
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

const getDefaultData = () => ({
  recentMovies: [],
  recentGames: [],
  recentBooks: [],
  recentSeries: [],
  stats: {
    movies: { total: 0, thisMonth: 0, avgRating: 0 },
    games: { total: 0, thisMonth: 0, avgRating: 0 },
    books: { total: 0, thisMonth: 0, avgRating: 0 },
    series: { total: 0, thisMonth: 0, avgRating: 0 },
  },
})
</script>
```

## Компоненты Dashboard

### 1. StatsOverview - Обзор статистики

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <!-- Фильмы -->
    <StatCard
      title="Фильмы"
      :total="stats.movies.total"
      :this-month="stats.movies.thisMonth"
      :avg-rating="stats.movies.avgRating"
      rating-max="100"
      icon="movie"
      color="indigo"
    />

    <!-- Игры -->
    <StatCard
      title="Игры"
      :total="stats.games.total"
      :this-month="stats.games.thisMonth"
      :avg-rating="stats.games.avgRating"
      rating-max="100"
      icon="game"
      color="green"
    />

    <!-- Книги -->
    <StatCard
      title="Книги"
      :total="stats.books.total"
      :this-month="stats.books.thisMonth"
      :avg-rating="stats.books.avgRating"
      rating-max="100"
      icon="book"
      color="blue"
    />

    <!-- Сериалы -->
    <StatCard
      title="Сериалы"
      :total="stats.series.total"
      :this-month="stats.series.thisMonth"
      :avg-rating="stats.series.avgRating"
      rating-max="10"
      icon="tv"
      color="orange"
    />
  </div>
</template>
```

### 2. StatCard - Карточка статистики

```vue
<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ total }}</p>
        <p v-if="thisMonth" class="text-xs text-gray-500 mt-1">+{{ thisMonth }} за месяц</p>
        <p v-else-if="subtitle" class="text-xs text-gray-500 mt-1">
          {{ subtitle }}
        </p>
      </div>
      <div :class="iconContainerClass">
        <component :is="icon" :class="iconClass" />
      </div>
    </div>
    <div v-if="avgRating !== undefined" class="mt-4 flex items-center text-xs text-gray-500">
      <span>Средняя оценка:</span>
      <span class="ml-1 font-medium text-gray-700">
        {{ avgRating?.toFixed(1) || '0' }}/{{ ratingMax }}
      </span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: String,
  total: Number,
  thisMonth: Number,
  subtitle: String,
  avgRating: Number,
  ratingMax: { type: Number, default: 100 },
  icon: String,
  color: String,
})

const iconContainerClass = computed(
  () => `w-12 h-12 bg-${props.color}-100 rounded-lg flex items-center justify-center`,
)

const iconClass = computed(() => `w-6 h-6 text-${props.color}-600`)
</script>
```

### 3. RecentContent - Последний контент

````vue
<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Последние фильмы -->
    <RecentMovies :movies="data.recentMovies" />

    <!-- Последние игры -->
    <RecentGames :games="data.recentGames" />

    <!-- Последние книги -->
    <RecentBooks :books="data.recentBooks" />

    <!-- Последние сериалы -->
    <RecentSeries :series="data.recentSeries" />
  </div>
</template>

### 4. RecentMovies - Последние фильмы ```vue
<template>
  <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
    <!-- Заголовок -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold text-gray-900">Последние фильмы</h3>
        <NuxtLink to="/movies" class="btn-primary-sm">
          Все фильмы
          <svg class="w-4 h-4 ml-2">...</svg>
        </NuxtLink>
      </div>
    </div>

    <!-- Контент -->
    <div class="p-6">
      <!-- Пустое состояние -->
      <div v-if="movies.length === 0" class="empty-state">
        <EmptyIcon />
        <p>Фильмы не найдены</p>
        <NuxtLink to="/movies/new" class="btn-primary-sm"> Добавить фильм </NuxtLink>
      </div>

      <!-- Список фильмов -->
      <div v-else class="space-y-4">
        <div v-for="movie in movies" :key="movie.id" class="recent-item">
          <MovieThumbnail :movie="movie" />
          <MovieInfo :movie="movie" />
        </div>
      </div>
    </div>
  </div>
</template>
````

### 5. MovieThumbnail - Миниатюра фильма

```vue
<template>
  <div class="w-12 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
    <svg
      v-if="!movie.poster"
      class="w-6 h-6 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"
      />
    </svg>
    <img v-else :src="posterUrl" :alt="movie.title" class="w-full h-full object-cover rounded" />
  </div>
</template>

<script setup>
const config = useRuntimeConfig()

const posterUrl = computed(() => {
  if (!props.movie.poster) return ''
  return props.movie.poster.startsWith('http')
    ? props.movie.poster
    : `${config.public.apiBase}${props.movie.poster}`
})
</script>
```

### 6. MovieInfo - Информация о фильме

```vue
<template>
  <div class="flex-1 min-w-0">
    <NuxtLink
      :to="`/movies/${movie.id}`"
      class="text-sm font-medium text-gray-900 truncate hover:text-indigo-600"
    >
      {{ movie.title }}
    </NuxtLink>
    <div class="flex items-center space-x-2 mt-1">
      <span v-if="movie.watchedAt" class="text-xs text-gray-500">
        {{ formatDate(movie.watchedAt) }}
      </span>
      <span v-if="movie.rating" class="text-xs text-indigo-600 font-medium">
        ★ {{ movie.rating }}/100
      </span>
      <span v-if="movie.releaseYear" class="text-xs text-gray-500">
        {{ movie.releaseYear }}
      </span>
    </div>
  </div>
</template>
```

## Структура данных

### 1. Ответ API для статистики

```javascript
// Фильмы
{
  total: 42,
  thisMonth: 5,
  avgRating: 78.5
}

// Игры
{
  total: 28,
  thisMonth: 3,
  avgRating: 82.1
}

// Книги
{
  total: 35,
  thisMonth: 4,
  avgRating: 76.8
}

// Сериалы
{
  total: 12,
  thisMonth: 2,
  avgRating: 8.3
}
```

### 2. Ответ API для последних элементов

```javascript
// Фильмы
{
  id: "uuid",
  title: "Название фильма",
  poster: "/uploads/poster.jpg",
  watchedAt: "2024-01-15",
  rating: 85,
  releaseYear: 2023
}

// Игры
{
  id: "uuid",
  title: "Название игры",
  completionDate: "2024-01-10",
  rating: 90,
  playTimeHours: 45.5
}

// Книги
{
  id: "uuid",
  title: "Название книги",
  cover: "/uploads/cover.jpg",
  publishedYear: 2023,
  rating: 85,
  author: {
    id: "uuid",
    name: "Имя автора"
  }
}

// Сериалы
{
  id: "uuid",
  title: "Название сериала",
  poster: "/uploads/poster.jpg",
  watchedAt: "2024-01-12",
  rating: 8.5,
  totalSeasons: 3,
  watchedSeasons: 2
}
```

## Оптимизация загрузки

### 1. Параллельные запросы

```javascript
// Оптимальный подход - все запросы параллельно
const [moviesResponse, gamesResponse, booksResponse, seriesResponse] = await Promise.all([
  $fetch(`${config.public.apiBase}/movies?limit=5`),
  $fetch(`${config.public.apiBase}/games?limit=5`),
  $fetch(`${config.public.apiBase}/books?limit=5`),
  $fetch(`${config.public.apiBase}/series?limit=5`),
])

const [allMovies, allGames, allBooks, allSeries] = await Promise.all([
  $fetch(`${config.public.apiBase}/movies/stats`),
  $fetch(`${config.public.apiBase}/games/stats`),
  $fetch(`${config.public.apiBase}/books/stats`),
  $fetch(`${config.public.apiBase}/series/stats`),
])
```

### 2. Кэширование

```javascript
// useAsyncData автоматически кэширует данные
const { data: dashboardData } = await useAsyncData(
  'dashboard',
  async () => {
    // Загрузка данных
  },
  {
    // Опции кэширования
    server: true,
    client: true,
  },
)
```

### 3. Обработка ошибок

```javascript
try {
  // Загрузка данных
} catch (e) {
  console.error('Dashboard data fetch error:', e)
  return getDefaultData() // Возвращаем данные по умолчанию
}
```

## Стили и классы

### Основные классы

```css
/* Сетка статистики */
.grid.grid-cols-1.md:grid-cols-2.lg:grid-cols-4.gap-6.mb-8

/* Карточки статистики */
.bg-white.rounded-lg.border.border-gray-200.p-6.shadow-sm

/* Иконки */
.w-12.h-12.bg-indigo-100.rounded-lg.flex.items-center.justify-center
.w-6.h-6.text-indigo-600

/* Сетка контента */
.grid.grid-cols-1.lg:grid-cols-3.gap-8

/* Карточки контента */
.bg-white.rounded-lg.border.border-gray-200.shadow-sm

/* Элементы списка */
.flex.items-center.space-x-4.p-3.rounded-lg.hover:bg-gray-50.transition-colors

/* Миниатюры */
.w-12.h-16.bg-gray-200.rounded.flex-shrink-0.flex.items-center.justify-center

/* Кнопки */
.inline-flex.items-center.px-4.py-2.bg-indigo-600.text-white.text-sm.font-medium.rounded-lg.hover:bg-indigo-700.transition-colors

/* Пустые состояния */
.text-center.py-8.text-gray-500
.w-12.h-12.mx-auto.text-gray-300.mb-3
```

## Адаптивность

### 1. Статистика

- Мобильные: 1 колонка
- Планшеты: 2 колонки
- Десктоп: 4 колонки

### 2. Контент

- Мобильные: 1 колонка
- Десктоп: 3 колонки

## Общие принципы

1. **Производительность** - параллельная загрузка данных
2. **Кэширование** - автоматическое кэширование useAsyncData
3. **Обработка ошибок** - graceful fallback
4. **Адаптивность** - поддержка всех устройств
5. **Пустые состояния** - понятные сообщения и CTA
6. **Навигация** - быстрые переходы к спискам
7. **Визуальная иерархия** - чёткое разделение секций

## Расширение функциональности

### 1. Добавление новой сущности

```javascript
// 1. Добавить в параллельные запросы
const booksResponse = await $fetch(`${config.public.apiBase}/books?limit=5`)

// 2. Добавить статистику
const allBooks = await $fetch(`${config.public.apiBase}/books/stats`)

// 3. Добавить в ответ
return {
  // ... существующие данные
  recentBooks: booksResponse.data || [],
  stats: {
    // ... существующая статистика
    books: allBooks,
  },
}

// 4. Добавить компонент в шаблон
<RecentBooks :books="data.recentBooks" />
```

### 2. Добавление новых метрик

```javascript
// В API статистики
{
  total: 42,
  thisMonth: 5,
  avgRating: 78.5,
  // Новые метрики
  thisYear: 23,
  topGenre: "Фантастика",
  avgDuration: 125
}
```

### 3. Периодическое обновление

```javascript
// Обновление каждые 30 секунд
const { data: dashboardData, refresh } = await useAsyncData('dashboard', async () => {
  // загрузка данных
})

// Интервальное обновление
onMounted(() => {
  const interval = setInterval(refresh, 30000)
  onUnmounted(() => clearInterval(interval))
})
```

Этот подход обеспечивает быструю загрузку, хорошую производительность и удобный пользовательский интерфейс для обзора всей коллекции.
