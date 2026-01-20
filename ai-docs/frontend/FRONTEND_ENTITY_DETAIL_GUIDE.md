# Документация: Страницы детального просмотра сущностей

## Обзор

В приложении используется унифицированный подход к созданию страниц детального просмотра сущностей. Каждая страница следует общей структуре с отображением полной информации о сущности и действиями для редактирования/удаления.

## Структура страницы детального просмотра

### 1. Основной шаблон

```vue
<template>
  <div class="mx-auto max-w-7xl">
    <!-- Хлебные крошки с названием сущности -->
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- Основная карточка -->
    <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <!-- Заголовок с кнопками действий -->
      <div class="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">
            {{ entityData?.title || entityName }}
          </h1>
          <p class="mt-1 text-sm text-gray-500" v-if="entityData">
            Детали {{ entityNameGenitive }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink :to="`/${entityType}/${route.params.id}/edit`" class="btn-edit">
            Редактировать
          </NuxtLink>
          <button @click="onDelete" :disabled="deleting" class="btn-delete">
            <svg v-if="deleting" class="animate-spin h-4 w-4">...</svg>
            <span>Удалить</span>
          </button>
        </div>
      </div>

      <!-- Основной контент -->
      <div class="px-6 py-6">
        <!-- Состояния загрузки -->
        <div v-if="pending" class="loading-state">Загрузка...</div>
        <div v-else-if="error" class="error-block">{{ error }}</div>
        <div v-else-if="!entityData" class="not-found">{{ entityNameCapitalized }} не найден.</div>

        <!-- Детальная информация -->
        <div v-else class="entity-details">
          <!-- Контент -->
        </div>
      </div>
    </div>
  </div>
</template>
```

### 2. Script секция

```vue
<script setup lang="ts">
// Конфигурация
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

// Состояние
const error = ref('')
const deleting = ref(false)

// Загрузка данных сущности
const { data: entityData, pending } = await useAsyncData(
  `${entityType}-${route.params.id}`,
  async () => {
    error.value = ''
    return $fetch(`${config.public.apiBase}/${entityType}/${route.params.id}`).catch((e) => {
      error.value = e?.data?.message || `Не удалось загрузить ${entityName}`
      return null
    })
  },
)

// Загрузка связанных данных (если есть)
const { data: relatedData } = await useAsyncData(
  `${entityType}-related-${route.params.id}`,
  async () => {
    if (!entityData.value?.relatedId) return null
    return $fetch(
      `${config.public.apiBase}/${relatedEntityType}/${entityData.value.relatedId}`,
    ).catch(() => null)
  },
  { watch: [entityData] },
)

// Удаление сущности
const onDelete = async () => {
  if (!entityData.value) return
  if (!confirm(`Удалить этот ${entityName}? Это действие нельзя отменить.`)) return

  deleting.value = true
  try {
    await $fetch(`${config.public.apiBase}/${entityType}/${route.params.id}`, {
      method: 'DELETE',
    })
    router.push(`/${entityType}`)
  } catch (e: any) {
    error.value = e?.data?.message || `Не удалось удалить ${entityName}`
  } finally {
    deleting.value = false
  }
}
</script>
```

## Типы сущностей и их особенности

### 1. Фильмы (/movies/[id]/index.vue)

**Особенности:**

- Постер фильма
- Связь с режиссёром
- Рейтинг 0-100
- Дата просмотра
- Комментарий

**Структура данных:**

```javascript
interface Movie {
  id: string
  title: string
  genre?: string | null
  poster?: string | null
  watchedAt?: string | null
  comment?: string | null
  rating?: number | null
  releaseYear?: number | null
  directorId?: string | null
  createdAt: string
  updatedAt: string
}
```

**Вёрстка:**

```vue
<div class="flex gap-6">
  <!-- Постер -->
  <div class="flex-shrink-0">
    <div v-if="movie.poster" class="w-40 h-56 rounded-lg overflow-hidden">
      <img :src="posterUrl" :alt="movie.title" class="w-full h-full object-cover" />
    </div>
    <div v-else class="w-40 h-56 rounded-lg bg-gray-100 flex items-center justify-center">
      <!-- Placeholder иконка -->
    </div>
  </div>

  <!-- Информация в 2 колонки -->
  <div class="flex-1 grid grid-cols-1 gap-6 md:grid-cols-2">
    <div class="space-y-4">
      <div>
        <div class="text-sm text-gray-500">Название</div>
        <div class="text-base text-gray-900 font-medium">{{ movie.title }}</div>
      </div>
      <!-- Другие поля -->
    </div>
  </div>
</div>
```

### 2. Сериалы (/series/[id]/index.vue)

**Особенности:**

- Постер сериала
- Жанры
- Страна производства
- Рейтинг 0-100
- Дата просмотра

**Структура данных:**

```javascript
interface Series {
  id: string
  title: string
  genres?: string
  country?: string
  poster?: string
  rating?: number
  watchedAt?: string
  comment?: string
  createdAt: string
  updatedAt: string
}
```

### 3. Игры (/games/[id]/index.vue)

**Особенности:**

- Без постера
- Дата прохождения
- Время в игре
- Рейтинг 1-100
- Комментарий

**Структура данных:**

```javascript
interface Game {
  id: string
  title: string
  completionDate?: string
  playTimeHours?: number
  rating?: number
  comment?: string
  createdAt: string
  updatedAt: string
}
```

**Вёрстка (без постера):**

```vue
<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
  <div class="space-y-4">
    <div>
      <div class="text-sm text-gray-500">Название</div>
      <div class="text-base text-gray-900 font-medium">{{ game.title }}</div>
    </div>
    <!-- Другие поля -->
  </div>
</div>
```

### 4. Режиссёры (/movies/directors/[id]/index.vue)

**Особенности:**

- Фото режиссёра
- Комментарий
- Список фильмов (связанные сущности)

**Структура данных:**

```javascript
interface Director {
  id: string
  fullName: string
  photo?: string
  comment?: string
  createdAt: string
  updatedAt: string
}
```

**Вёрстка с фото:**

```vue
<div class="flex gap-6">
  <!-- Фото -->
  <div class="flex-shrink-0">
    <div v-if="director.photo" class="w-32 h-40 rounded-lg overflow-hidden">
      <img :src="photoUrl" :alt="director.fullName" class="w-full h-full object-cover" />
    </div>
    <div v-else class="w-32 h-40 rounded-lg bg-gray-100 flex items-center justify-center">
      <!-- Placeholder иконка -->
    </div>
  </div>

  <!-- Информация -->
  <div class="flex-1 space-y-4">
    <div>
      <div class="text-sm text-gray-500">ФИО</div>
      <div class="text-base text-gray-900 font-medium">{{ director.fullName }}</div>
    </div>
    <!-- Другие поля -->
  </div>
</div>
```

### 5. Авторы (/books/authors/[id]/index.vue)

**Особенности:**

- Фото автора
- Даты рождения/смерти
- Страна
- Список книг

**Структура данных:**

```javascript
interface Author {
  id: string
  name: string
  birthYear?: number
  deathYear?: number
  country?: string
  photo?: string
  comment?: string
  createdAt: string
  updatedAt: string
}
```

### 6. Книги (/books/[id]/index.vue)

**Особенности:**

- Обложка книги
- Автор (связанная сущность)
- Описание
- Год издания
- Количество страниц

**Структура данных:**

```javascript
interface Book {
  id: string
  title: string
  description?: string
  publishedYear?: number
  genre?: string
  pages?: number
  cover?: string
  author?: Author
  createdAt: string
  updatedAt: string
}
```

## Общие компоненты и паттерны

### 1. Загрузка изображения

```vue
<script setup>
const config = useRuntimeConfig()

const posterUrl = computed(() => {
  if (!entityData.value?.poster) return ''
  return entityData.value.poster.startsWith('http')
    ? entityData.value.poster
    : `${config.public.apiBase}${entityData.value.poster}`
})
</script>

<template>
  <img :src="posterUrl" :alt="entityData.title" class="w-full h-full object-cover" />
</template>
```

### 2. Placeholder для отсутствующего изображения

```vue
<div v-else class="w-40 h-56 rounded-lg bg-gray-100 flex items-center justify-center">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="h-12 w-12 text-gray-300"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
    />
  </svg>
</div>
```

### 3. Отображение связанных сущностей

```vue
<div>
  <div class="text-sm text-gray-500">Режиссёр</div>
  <div class="text-base text-gray-900">
    <NuxtLink
      v-if="director"
      :to="`/movies/directors/${director.id}`"
      class="text-indigo-600 hover:text-indigo-900"
    >
      {{ director.fullName }}
    </NuxtLink>
    <span v-else>—</span>
  </div>
</div>
```

### 4. Форматирование дат

```vue
<div>
  <div class="text-sm text-gray-500">Дата просмотра</div>
  <div class="text-gray-900 m-0">
    <DateDisplay v-if="entityData.watchedAt" :date="entityData.watchedAt" />
    <span v-else>—</span>
  </div>
</div>
```

### 5. Отображение рейтингов

```vue
<div>
  <div class="text-sm text-gray-500">Рейтинг</div>
  <div class="text-base text-gray-900">
    {{ entityData.rating != null ? `${entityData.rating}/100` : '—' }}
  </div>
</div>
```

### 6. Мета-информация

```vue
<div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
  <div>
    <div class="tracking-wide">Создано</div>
    <div class="text-gray-900 m-0">
      <DateDisplay :date="entityData.createdAt" />
    </div>
  </div>
  <div>
    <div class="tracking-wide">Обновлено</div>
    <div class="text-gray-900 m-0">
      <DateDisplay :date="entityData.updatedAt" />
    </div>
  </div>
</div>
```

### 7. Кнопки действий

```vue
<template>
  <div class="flex items-center gap-3">
    <!-- Редактировать -->
    <NuxtLink
      :to="`/${entityType}/${route.params.id}/edit`"
      class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white shadow-sm transition hover:bg-indigo-700"
    >
      Редактировать
    </NuxtLink>

    <!-- Удалить -->
    <button
      @click="onDelete"
      :disabled="deleting"
      class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <svg
        v-if="deleting"
        class="h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span>Удалить</span>
    </button>
  </div>
</template>
```

## Конфигурация для разных сущностей

### Фильмы

```javascript
const entityType = 'movies'
const entityName = 'фильм'
const entityNameGenitive = 'фильма'
const entityNameCapitalized = 'Фильм'
const hasImage = true
const imageLabel = 'Постер'
const imageSize = { width: 'w-40', height: 'h-56' }
```

### Игры

```javascript
const entityType = 'games'
const entityName = 'игра'
const entityNameGenitive = 'игры'
const entityNameCapitalized = 'Игра'
const hasImage = false
```

### Режиссёры

```javascript
const entityType = 'directors'
const entityName = 'режиссёр'
const entityNameGenitive = 'режиссёра'
const entityNameCapitalized = 'Режиссёр'
const hasImage = true
const imageLabel = 'Фото'
const imageSize = { width: 'w-32', height: 'h-40' }
```

## Стили и классы

### Основные классы

```css
/* Контейнер */
.mx-auto.max-w-7xl

/* Карточка */
.rounded-xl.border.border-gray-200.shadow-sm.overflow-hidden

/* Заголовок */
.border-b.border-gray-200.px-6.py-5
.text-xl.md:text-2xl.font-semibold.text-gray-900

/* Информация */
.flex.gap-6
.flex-shrink-0
.flex-1.grid.grid-cols-1.gap-6.md:grid-cols-2

/* Поля */
.space-y-4
.text-sm.text-gray-500
.text-base.text-gray-900.font-medium

/* Кнопки */
.inline-flex.items-center.gap-2.rounded-lg.bg-indigo-600
.hover:bg-indigo-700.disabled:opacity-60

/* Состояния */
.text-gray-500 (загрузка)
.border-red-200.bg-red-50 (ошибка)
```

## Общие принципы

1. **Единообразие** - все страницы следуют одной структуре
2. **Загрузка данных** - предварительная загрузка с обработкой ошибок
3. **Связанные сущности** - отображение связей (авторы, режиссёры)
4. **Изображения** - поддержка с placeholder для отсутствующих
5. **Действия** - редактирование и удаление с подтверждением
6. **Адаптивность** - поддержка мобильных устройств
7. **Доступность** - семантическая разметка

## Пример создания новой страницы деталей

1. Создать страницу `/{entity}/[id]/index.vue` по шаблону
2. Определить интерфейс данных сущности
3. Настроить загрузку данных и связанных сущностей
4. Добавить отображение полей и связей
5. Настроить обработку изображений
6. Добавить действия редактирования/удаления

Этот подход обеспечивает консистентность и ускоряет разработку новых модулей детального просмотра.
