# Документация: Компоненты и структура папок на фронте

## Обзор

В frontend-части приложения используется чёткая структура папок и правила для создания компонентов. Это обеспечивает поддерживаемость, переиспользование и консистентность кода.

## Структура папок

### 1. Основная структура

```
packages/client/
├── components/          # Переиспользуемые компоненты
│   ├── ui/             # Базовые UI компоненты
│   ├── forms/          # Компоненты форм
│   ├── layout/         # Компоненты компоновки
│   └── entities/       # Компоненты сущностей
├── pages/              # Страницы Nuxt
│   ├── movies/         # Страницы фильмов
│   ├── games/          # Страницы игр
│   ├── series/         # Страницы сериалов
│   └── books/          # Страницы книг
├── composables/        # Composables (логика)
├── utils/              # Утилиты
├── types/              # TypeScript типы
└── assets/             # Статические ресурсы
```

### 2. Папка components/

#### 2.1. ui/ - Базовые UI компоненты

```
components/ui/
├── Button.vue
├── Input.vue
├── Select.vue
├── Modal.vue
├── Card.vue
├── Badge.vue
├── Spinner.vue
├── Icon.vue
├── Tooltip.vue
└── index.ts           # Экспорт всех UI компонентов
```

**Правила для UI компонентов:**

- Простые и переиспользуемые
- Не содержат бизнес-логики
- Принимают props для настройки
- Используют слоты для гибкости
- Имеют префикс `Base` (опционально)

#### 2.2. forms/ - Компоненты форм

```
components/forms/
├── FormField.vue       # Обёртка для поля формы
├── FormInput.vue       # Инпут с валидацией
├── FormSelect.vue      # Селект с валидацией
├── FormTextarea.vue    # Textarea с валидацией
├── FormCheckbox.vue    # Чекбокс с валидацией
├── FormRadio.vue       # Радио с валидацией
├── FormFile.vue        # Загрузка файлов
└── index.ts
```

**Правила для форм:**

- Инкапсулируют логику валидации
- Работают с v-model
- Показывают ошибки валидации
- Поддерживают disabled состояние

#### 2.3. layout/ - Компоненты компоновки

```
components/layout/
├── Header.vue
├── Footer.vue
├── Sidebar.vue
├── Container.vue       # Центрирующий контейнер
├── Grid.vue           # Сетка
├── Flex.vue           # Flex контейнер
├── Breadcrumbs.vue
└── index.ts
```

**Правила для layout:**

- Отвечают только за расположение
- Не содержат бизнес-логики
- Могут содержать другие компоненты

#### 2.4. entities/ - Компоненты сущностей

```
components/entities/
├── movies/
│   ├── MovieCard.vue
│   ├── MovieList.vue
│   ├── MovieForm.vue
│   └── index.ts
├── games/
│   ├── GameCard.vue
│   ├── GameList.vue
│   ├── GameForm.vue
│   └── index.ts
├── books/
│   ├── BookCard.vue
│   ├── BookList.vue
│   ├── BookForm.vue
│   └── index.ts
└── series/
    ├── SeriesCard.vue
    ├── SeriesList.vue
    ├── SeriesForm.vue
    └── index.ts
```

**Правила для сущностей:**

- Содержат бизнес-логику конкретной сущности
- Используют UI компоненты
- Могут иметь сложную структуру
- Группируются по типам сущностей

### 3. Папка pages/

#### 3.1. Структура страниц сущности

```
pages/books/
├── index.vue           # Список книг
├── new.vue            # Создание книги
├── [id]/
│   ├── index.vue       # Детали книги
│   └── edit.vue        # Редактирование книги
└── authors/
    ├── index.vue       # Список авторов
    ├── new.vue        # Создание автора
    └── [id]/
        ├── index.vue   # Детали автора
        └── edit.vue    # Редактирование автора
```

**Правила для страниц:**

- Каждая страница в отдельном файле
- Используют компоненты из entities/
- Содержат логику загрузки данных
- Обрабатывают маршрутизацию

## Правила создания компонентов

### 1. Именование компонентов

#### 1.1. Файлы компонентов

- Использовать PascalCase: `MovieCard.vue`
- Индексные файлы: `index.ts`
- Компоненты страниц: `index.vue`, `new.vue`, `edit.vue`

#### 1.2. Названия компонентов

```vue
<script setup>
// Правильно: описательное имя
defineOptions({
  name: 'MovieCard',
})

// Неправильно: слишком общее имя
defineOptions({
  name: 'Card',
})
</script>
```

### 2. Структура компонента

#### 2.1. Базовая структура

```vue
<template>
  <!-- Шаблон компонента -->
</template>

<script setup lang="ts">
// Импорты
import type { ComponentProps } from '~/types'

// Props
interface Props {
  title: string
  description?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  disabled: false,
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
  change: [value: string]
}>()

// Реактивные данные
const isLoading = ref(false)
const localValue = ref('')

// Computed свойства
const computedValue = computed(() => {
  return props.title.toUpperCase()
})

// Методы
const handleClick = (event: MouseEvent) => {
  emit('click', event)
}

// Lifecycle хуки
onMounted(() => {
  // Инициализация
})
</script>

<style scoped>
/* Стили компонента */
.component-class {
  /* стили */
}
</style>
```

#### 2.2. Порядок секций

1. `<template>` - шаблон компонента
2. `<script setup lang="ts">` - логика компонента
   - Импорты
   - Props и emits
   - Реактивные данные
   - Computed свойства
   - Методы
   - Lifecycle хуки
3. `<style scoped>` - стили компонента

### 3. TypeScript и типы

#### 3.1. Определение типов

```typescript
// types/entities.ts
export interface Movie {
  id: string
  title: string
  genre?: string
  rating?: number
  poster?: string
  createdAt: string
  updatedAt: string
}

export interface MovieCardProps {
  movie: Movie
  showRating?: boolean
  compact?: boolean
}
```

#### 3.2. Использование типов в компоненте

```vue
<script setup lang="ts">
import type { Movie, MovieCardProps } from '~/types/entities'

interface Props extends MovieCardProps {}

const props = withDefaults(defineProps<Props>(), {
  showRating: true,
  compact: false,
})
</script>
```

### 4. Props и Emits

#### 4.1. Правила для Props

```vue
<script setup lang="ts">
// Правильно: строгая типизация
interface Props {
  title: string // Обязательный строковый prop
  count?: number // Опциональный числовой prop
  items: string[] // Обязательный массив
  config?: {
    // Опциональный объект
    color: string
    size: 'small' | 'large'
  }
}

// Правильно: значения по умолчанию
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  config: () => ({ color: 'blue', size: 'small' }),
})
</script>
```

#### 4.2. Правила для Emits

```vue
<script setup lang="ts">
// Правильно: строгая типизация событий
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'item-click': [item: { id: string; name: string }]
  delete: [id: string]
}>()

// Использование
const handleClick = (item: { id: string; name: string }) => {
  emit('item-click', item)
}
</script>
```

### 5. Стили компонентов

#### 5.1. Scoped стили

```vue
<style scoped>
// Правильно: scoped стили
.card {
  @apply bg-white rounded-lg shadow-sm p-4;
}

.card:hover {
  @apply shadow-md;
}

// Вложенные элементы
.card__title {
  @apply text-lg font-semibold text-gray-900;
}

.card__content {
  @apply text-sm text-gray-600 mt-2;
}
</style>
```

#### 5.2. CSS классы

```vue
<template>
  <!-- BEM методология -->
  <div class="movie-card">
    <div class="movie-card__header">
      <h3 class="movie-card__title">{{ movie.title }}</h3>
      <div class="movie-card__rating">{{ movie.rating }}</div>
    </div>
    <div class="movie-card__content">
      <p class="movie-card__description">{{ movie.description }}</p>
    </div>
    <div class="movie-card__actions">
      <button class="movie-card__button movie-card__button--primary">Edit</button>
    </div>
  </div>
</template>

<style scoped>
.movie-card {
  @apply bg-white rounded-lg shadow-sm overflow-hidden;
}

.movie-card__header {
  @apply p-4 border-b border-gray-200;
}

.movie-card__title {
  @apply text-lg font-semibold text-gray-900;
}

.movie-card__rating {
  @apply text-sm text-indigo-600 font-medium;
}

.movie-card__content {
  @apply p-4;
}

.movie-card__description {
  @apply text-sm text-gray-600;
}

.movie-card__actions {
  @apply p-4 bg-gray-50 flex justify-end;
}

.movie-card__button {
  @apply px-3 py-2 text-sm rounded-md transition-colors;
}

.movie-card__button--primary {
  @apply bg-indigo-600 text-white hover:bg-indigo-700;
}
</style>
```

### 6. Composables

#### 6.1. Структура composables

```typescript
// composables/useMovie.ts
import type { Movie } from '~/types/entities'

export const useMovie = () => {
  // Состояние
  const movies = ref<Movie[]>([])
  const loading = ref(false)
  const error = ref('')

  // Методы
  const fetchMovies = async () => {
    loading.value = true
    error.value = ''

    try {
      const config = useRuntimeConfig()
      const response = await $fetch<Movie[]>(`${config.public.apiBase}/movies`)
      movies.value = response
    } catch (e) {
      error.value = 'Failed to fetch movies'
    } finally {
      loading.value = false
    }
  }

  const createMovie = async (movieData: Partial<Movie>) => {
    // логика создания
  }

  const deleteMovie = async (id: string) => {
    // логика удаления
  }

  return {
    // Состояние (только для чтения)
    movies: readonly(movies),
    loading: readonly(loading),
    error: readonly(error),

    // Методы
    fetchMovies,
    createMovie,
    deleteMovie,
  }
}
```

#### 6.2. Использование composables

```vue
<script setup lang="ts">
// Использование composable
const { movies, loading, error, fetchMovies } = useMovie()

// Загрузка данных при монтировании
onMounted(() => {
  fetchMovies()
})
</script>
```

### 7. Утилиты

#### 7.1. Структура utils

```typescript
// utils/format.ts
export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU')
}

export const formatRating = (rating: number, max: number = 100): string => {
  return `${rating}/${max}`
}

// utils/validation.ts
export const required = (value: any): boolean => {
  return value !== null && value !== undefined && value !== ''
}

export const minLength = (value: string, min: number): boolean => {
  return value.length >= min
}

// utils/api.ts
export const createApiUrl = (endpoint: string, params?: Record<string, any>): string => {
  const config = useRuntimeConfig()
  const url = new URL(`${config.public.apiBase}${endpoint}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  return url.toString()
}
```

### 8. Тестирование компонентов

#### 8.1. Структура тестов

```typescript
// components/entities/movies/MovieCard.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import MovieCard from '~/components/entities/movies/MovieCard.vue'
import type { Movie } from '~/types/entities'

describe('MovieCard', () => {
  const mockMovie: Movie = {
    id: '1',
    title: 'Test Movie',
    genre: 'Action',
    rating: 85,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  }

  it('renders movie information correctly', () => {
    const wrapper = mount(MovieCard, {
      props: { movie: mockMovie },
    })

    expect(wrapper.find('.movie-card__title').text()).toBe('Test Movie')
    expect(wrapper.find('.movie-card__rating').text()).toBe('85/100')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(MovieCard, {
      props: { movie: mockMovie },
    })

    await wrapper.find('.movie-card').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual([mockMovie])
  })
})
```

## Лучшие практики

### 1. Размер компонентов

- **Маленькие**: 50-100 строк (UI компоненты)
- **Средние**: 100-300 строк (компоненты сущностей)
- **Большие**: 300+ строк (страницы, сложные формы)

### 2. Переиспользование

- Создавайте UI компоненты для переиспользования
- Избегайте дублирования кода
- Используйте слоты для гибкости

### 3. Производительность

- Используйте `v-show` вместо `v-if` для частых переключений
- Применяйте `v-memo` для дорогих вычислений
- Лениво загружайте большие компоненты

### 4. Доступность

- Используйте семантические теги
- Добавляйте ARIA атрибуты
- Обеспечьте навигацию с клавиатуры

### 5. Консистентность

- Следуйте единому стилю кода
- Используйте одинаковые паттерны
- Документируйте сложные компоненты

## Пример создания нового компонента

### 1. Создание UI компонента

```vue
<!-- components/ui/Badge.vue -->
<template>
  <span :class="badgeClasses" :variant="variant" :size="size">
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
})

const badgeClasses = computed(() => ['badge', `badge--${props.variant}`, `badge--${props.size}`])
</script>

<style scoped>
.badge {
  @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
}

.badge--default {
  @apply bg-gray-100 text-gray-800;
}

.badge--primary {
  @apply bg-blue-100 text-blue-800;
}

.badge--success {
  @apply bg-green-100 text-green-800;
}

.badge--warning {
  @apply bg-yellow-100 text-yellow-800;
}

.badge--error {
  @apply bg-red-100 text-red-800;
}

.badge--sm {
  @apply px-1.5 py-0.5 text-xs;
}

.badge--md {
  @apply px-2 py-1 text-sm;
}

.badge--lg {
  @apply px-3 py-1.5 text-base;
}
</style>
```

### 2. Создание компонента сущности

```vue
<!-- components/entities/books/BookCard.vue -->
<template>
  <div class="book-card" @click="handleClick">
    <div class="book-card__cover">
      <img v-if="book.cover" :src="coverUrl" :alt="book.title" class="book-card__image" />
      <div v-else class="book-card__placeholder">
        <Icon name="book" class="book-card__icon" />
      </div>
    </div>

    <div class="book-card__content">
      <h3 class="book-card__title">{{ book.title }}</h3>
      <p v-if="book.author" class="book-card__author">
        {{ book.author.name }}
      </p>
      <div class="book-card__meta">
        <Badge v-if="book.genre" :variant="genreVariant">
          {{ book.genre }}
        </Badge>
        <span v-if="book.publishedYear" class="book-card__year">
          {{ book.publishedYear }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Book } from '~/types/entities'

interface Props {
  book: Book
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
})

const emit = defineEmits<{
  click: [book: Book]
}>()

const config = useRuntimeConfig()

const coverUrl = computed(() => {
  if (!props.book.cover) return ''
  return props.book.cover.startsWith('http')
    ? props.book.cover
    : `${config.public.apiBase}/${props.book.cover}`
})

const genreVariant = computed(() => {
  const genreMap: Record<string, 'primary' | 'success' | 'warning'> = {
    Фантастика: 'primary',
    Детектив: 'success',
    Роман: 'warning',
  }
  return genreMap[props.book.genre || ''] || 'default'
})

const handleClick = () => {
  emit('click', props.book)
}
</script>

<style scoped>
.book-card {
  @apply bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer transition-shadow hover:shadow-md;
}

.book-card__cover {
  @apply relative h-48 bg-gray-100;
}

.book-card__image {
  @apply w-full h-full object-cover;
}

.book-card__placeholder {
  @apply w-full h-full flex items-center justify-center;
}

.book-card__icon {
  @apply w-12 h-12 text-gray-400;
}

.book-card__content {
  @apply p-4;
}

.book-card__title {
  @apply text-lg font-semibold text-gray-900 truncate;
}

.book-card__author {
  @apply text-sm text-gray-600 mt-1;
}

.book-card__meta {
  @apply flex items-center justify-between mt-3;
}

.book-card__year {
  @apply text-xs text-gray-500;
}
</style>
```

Эта структура обеспечивает чистоту кода, переиспользование и лёгкость поддержки в долгосрочной перспективе.
