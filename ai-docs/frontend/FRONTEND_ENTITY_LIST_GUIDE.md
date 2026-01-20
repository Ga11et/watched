# Документация: Страницы списков сущностей

## Обзор

В приложении используется унифицированный подход к созданию страниц списков для всех сущностей (фильмы, сериалы, игры, книги, авторы, режиссёры). Каждая страница списка следует общей структуре и использует общие компоненты.

## Структура страницы списка

### 1. Основные компоненты страницы

```vue
<template>
  <div class="mx-auto max-w-7xl">
    <!-- Хлебные крошки -->
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- Блок ошибок -->
    <div v-if="error" class="error-block">
      {{ error }}
    </div>

    <!-- Заголовок и панель управления -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">{{ entityTitle }}</h2>
      <div class="flex items-center gap-3">
        <!-- Переключатель вида -->
        <ViewModeToggle v-model="viewMode" />

        <!-- Дополнительные кнопки (если есть) -->
        <NuxtLink v-if="relatedEntity" :to="relatedEntity.link">
          {{ relatedEntity.title }}
        </NuxtLink>

        <!-- Кнопка добавления -->
        <NuxtLink :to="newEntityLink" class="btn-primary"> Добавить {{ entityName }} </NuxtLink>
      </div>
    </div>

    <!-- Пустое состояние -->
    <EmptyState v-if="!entities?.length" :entity-name="entityName" />

    <!-- Основной контент -->
    <Transition name="fade" mode="out-in">
      <EntityCardsView
        v-if="viewMode === 'cards' && entities?.length"
        :entities="entities"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
      <EntityTableView
        v-else-if="entities?.length"
        :entities="entities"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
    </Transition>
  </div>
</template>
```

### 2. Script секция

```vue
<script setup>
// Конфигурация
const config = useRuntimeConfig()
const router = useRouter()

// Состояние
const error = ref('')

// Настройки вида и сортировки (сохраняются в cookies)
const viewMode = useCookie(`watched_${entityType}_view_mode`, {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortBy = useCookie(`watched_${entityType}_sort_by`, {
  default: () => defaultSortField,
  sameSite: 'lax',
})

const sortOrder = useCookie(`watched_${entityType}_sort_order`, {
  default: () => 'DESC',
  sameSite: 'lax',
})

// Загрузка данных
const { data: entities, refresh } = await useFetch(`${config.public.apiBase}/${entityType}`, {
  query: { sortBy, sortOrder },
})

// Обновление сортировки
const updateSorting = (newSortBy) => {
  if (sortBy.value === newSortBy) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = newSortBy
    sortOrder.value = 'ASC'
  }
  refresh()
}

// Валидация вида
watchEffect(() => {
  if (viewMode.value !== 'cards' && viewMode.value !== 'table') {
    viewMode.value = 'cards'
  }
})
</script>
```

### 3. Стили

```vue
<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

## Компоненты

### 1. ViewModeToggle (Переключатель вида)

```vue
<template>
  <div class="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
    <button
      type="button"
      class="rounded-md px-3 py-1.5 text-sm transition"
      :class="modelValue === 'cards' ? 'active' : 'inactive'"
      @click="$emit('update:modelValue', 'cards')"
    >
      Карточки
    </button>
    <button
      type="button"
      class="rounded-md px-3 py-1.5 text-sm transition"
      :class="modelValue === 'table' ? 'active' : 'inactive'"
      @click="$emit('update:modelValue', 'table')"
    >
      Таблица
    </button>
  </div>
</template>
```

### 2. EmptyState (Пустое состояние)

```vue
<template>
  <div class="text-center py-12 text-gray-500">
    {{ entityName.charAt(0).toUpperCase() + entityName.slice(1) }} пока нет. Добавьте свой первый
    {{ entityName }}!
  </div>
</template>
```

### 3. EntityCardsView (Вид карточками)

```vue
<template>
  <div>
    <div class="mb-6">
      <SortControl
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :options="sortOptions"
        @update-sorting="handleSortUpdate"
      />
    </div>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <EntityCard v-for="entity in entities" :key="entity.id" :entity="entity" />
    </div>
  </div>
</template>
```

### 4. EntityTableView (Вид таблицей)

```vue
<template>
  <div>
    <div class="mb-6">
      <SortControl
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :options="sortOptions"
        @update-sorting="handleSortUpdate"
      />
    </div>
    <Table :headers="headers" :items="tableItems" @edit="handleEdit" @delete="handleDelete" />
  </div>
</template>
```

## Конфигурация для разных сущностей

### Фильмы (/movies/index.vue)

```javascript
const entityType = 'movies'
const entityTitle = 'Фильмы'
const entityName = 'фильм'
const newEntityLink = '/movies/new'
const defaultSortField = 'watchedAt'

const breadcrumbItems = [{ label: 'Главная', to: '/' }, { label: 'Фильмы' }]

const relatedEntity = {
  title: 'Режиссёры',
  link: '/movies/directors',
}
```

### Сериалы (/series/index.vue)

```javascript
const entityType = 'series'
const entityTitle = 'Сериалы'
const entityName = 'сериал'
const newEntityLink = '/series/new'
const defaultSortField = 'watchedAt'

const breadcrumbItems = [{ label: 'Главная', to: '/' }, { label: 'Сериалы' }]
```

### Игры (/games/index.vue)

```javascript
const entityType = 'games'
const entityTitle = 'Игры'
const entityName = 'игра'
const newEntityLink = '/games/new'
const defaultSortField = 'completionDate'

const breadcrumbItems = [{ label: 'Главная', to: '/' }, { label: 'Игры' }]
```

### Книги (/books/index.vue)

```javascript
const entityType = 'books'
const entityTitle = 'Книги'
const entityName = 'книга'
const newEntityLink = '/books/new'
const defaultSortField = 'createdAt'

const breadcrumbItems = [{ label: 'Главная', to: '/' }, { label: 'Книги' }]

const relatedEntity = {
  title: 'Авторы',
  link: '/books/authors',
}
```

### Авторы (/books/authors/index.vue)

```javascript
const entityType = 'authors'
const entityTitle = 'Авторы'
const entityName = 'автора'
const newEntityLink = '/books/authors/new'
const defaultSortField = 'name'

const breadcrumbItems = [
  { label: 'Главная', to: '/' },
  { label: 'Книги', to: '/books' },
  { label: 'Авторы' },
]
```

### Режиссёры (/movies/directors/index.vue)

```javascript
const entityType = 'directors'
const entityTitle = 'Режиссёры'
const entityName = 'режиссёра'
const newEntityLink = '/movies/directors/new'
const defaultSortField = 'name'

const breadcrumbItems = [
  { label: 'Главная', to: '/' },
  { label: 'Фильмы', to: '/movies' },
  { label: 'Режиссёры' },
]
```

## Опции сортировки

### Фильмы

```javascript
const sortOptions = [
  { value: 'title', label: 'По названию' },
  { value: 'genre', label: 'По жанру' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'watchedAt', label: 'По дате просмотра' },
  { value: 'releaseYear', label: 'По году выхода' },
]
```

### Сериалы

```javascript
const sortOptions = [
  { value: 'title', label: 'По названию' },
  { value: 'genre', label: 'По жанру' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'watchedAt', label: 'По дате просмотра' },
  { value: 'releaseYear', label: 'По году выхода' },
]
```

### Игры

```javascript
const sortOptions = [
  { value: 'title', label: 'По названию' },
  { value: 'genre', label: 'По жанру' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'completionDate', label: 'По дате прохождения' },
  { value: 'releaseYear', label: 'По году выхода' },
]
```

### Книги

```javascript
const sortOptions = [
  { value: 'title', label: 'По названию' },
  { value: 'author', label: 'По автору' },
  { value: 'genre', label: 'По жанру' },
  { value: 'publishedYear', label: 'По году издания' },
  { value: 'pages', label: 'По количеству страниц' },
  { value: 'createdAt', label: 'По дате добавления' },
]
```

### Авторы/Режиссёры

```javascript
const sortOptions = [
  { value: 'name', label: 'По имени' },
  { value: 'country', label: 'По стране' },
  { value: 'birthYear', label: 'По году рождения' },
  { value: 'createdAt', label: 'По дате добавления' },
]
```

## Правила именования

### Cookies

- Вид: `watched_{entity}_view_mode`
- Сортировка: `watched_{entity}_sort_by`
- Порядок: `watched_{entity}_sort_order`

### Компоненты

- Карточка: `{Entity}Card.vue`
- Вид карточками: `{Entity}CardsView.vue`
- Вид таблицей: `{Entity}TableView.vue`

### Страницы

- Список: `/{entity}/index.vue`
- Создание: `/{entity}/new.vue`
- Детали: `/{entity}/[id].vue`
- Редактирование: `/{entity}/[id]/edit.vue`

## Общие принципы

1. **Единообразие** - все страницы списков следуют одной структуре
2. **Сохранение состояния** - вид и сортировка сохраняются в cookies
3. **Переиспользование** - общие компоненты для всех сущностей
4. **Адаптивность** - поддержка мобильных устройств
5. **Доступность** - семантическая разметка и ARIA-атрибуты
6. **Оптимизация** - ленивая загрузка и кэширование

## Пример создания новой сущности

1. Создать страницу `/new-entity/index.vue` по шаблону
2. Создать компоненты `NewEntityCard.vue`, `NewEntityCardsView.vue`, `NewEntityTableView.vue`
3. Настроить опции сортировки и хлебные крошки
4. Добавить роуты в навигацию

Этот подход обеспечивает консистентность и ускоряет разработку новых модулей.
