# Документация: Страницы создания сущностей

## Обзор

В приложении используется унифицированный подход к созданию страниц добавления новых сущностей. Каждая страница создания следует общей структуре с учётом специфики конкретной сущности.

## Структура страницы создания

### 1. Основной шаблон

```vue
<template>
  <div class="mx-auto max-w-7xl">
    <!-- Хлебные крошки -->
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- Основная карточка формы -->
    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <!-- Заголовок -->
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить {{ entityName }}</h1>
          <p class="mt-1 text-sm text-gray-500">{{ formDescription }}</p>
        </div>
      </div>

      <!-- Форма -->
      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <!-- Контент формы -->
        <div class="flex gap-6">
          <!-- Фото/Постер (если есть) -->
          <PhotoUpload
            v-if="hasPhoto"
            v-model="photoFile"
            v-model:preview="photoPreview"
            :label="photoLabel"
            :error="errors.photo"
            class="flex-shrink-0"
          />

          <!-- Основные поля -->
          <div class="flex-1 grid grid-cols-1 gap-6">
            <!-- Поля формы -->
          </div>
        </div>

        <!-- Кнопки действий -->
        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink :to="cancelLink" class="btn-cancel"> Отмена </NuxtLink>
          <button type="submit" :disabled="submitting" class="btn-primary">
            {{ submitting ? 'Сохранение...' : 'Создать' }}
          </button>
        </div>

        <!-- Блок ошибок -->
        <div v-if="error" class="error-block">
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>
```

### 2. Script секция

```vue
<script setup lang="ts">
// Конфигурация
const config = useRuntimeConfig()
const router = useRouter()

// Состояние
const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

// Файлы и превью
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

// Данные формы
const form = reactive({
  // Поля формы
})

// Валидация и отправка
const onSubmit = async () => {
  if (submitting.value) return

  submitting.value = true
  errors.value = {}
  error.value = ''

  try {
    // Валидация
    validateForm()

    // Подготовка данных
    const payload = preparePayload()

    // Отправка
    await $fetch(`${config.public.apiBase}/${entityType}`, {
      method: 'POST',
      body: payload,
    })

    // Редирект
    router.push(successRedirect)
  } catch (e: any) {
    handleErrors(e)
  } finally {
    submitting.value = false
  }
}
</script>
```

## Типы сущностей и их особенности

### 1. Фильмы (/movies/new.vue)

**Особенности:**

- Интеграция с TMDB API для поиска фильмов
- Загрузка постера
- Связь с режиссёром
- Рейтинг 0-100
- Дата просмотра

**Структура формы:**

```javascript
const form = reactive({
  genre: '',
  directorId: '',
  watchedAt: today,
  rating: undefined,
  releaseYear: undefined,
  comment: '',
})

const tmdbMovie = (ref < TmdbMovie) | (null > null)
const manualTitle = ref('')
```

**Ключевые компоненты:**

- `TmdbMovieSearch` - поиск фильмов
- `PhotoUpload` - загрузка постера
- `CustomSelect` - выбор режиссёра

### 2. Сериалы (/series/new.vue)

**Особенности:**

- Интеграция с TMDB API для поиска сериалов
- Загрузка постера
- Рейтинг 0-100
- Дата просмотра
- Страна производства

**Структура формы:**

```javascript
const form = reactive({
  genres: '',
  country: '',
  rating: undefined,
  watchedAt: '',
  comment: '',
})

const tmdbSeries = (ref < TmdbSeries) | (null > null)
const manualTitle = ref('')
```

### 3. Игры (/games/new.vue)

**Особенности:**

- Простая форма без внешних API
- Время в игре (часы)
- Дата прохождения
- Рейтинг 1-100

**Структура формы:**

```javascript
const form = reactive({
  title: '',
  completionDate: new Date().toISOString().slice(0, 10),
  playTimeHours: undefined,
  comment: '',
  rating: undefined,
})
```

### 4. Режиссёры (/movies/directors/new.vue)

**Особенности:**

- Интеграция с TMDB API для поиска людей
- Загрузка фото
- Поддержка редиректа после создания

**Структура формы:**

```javascript
const form = reactive({
  comment: '',
})

const person = (ref < TmdbPerson) | (null > null)
const manualName = ref('')
```

### 5. Авторы (/books/authors/new.vue)

**Особенности:**

- Простая форма
- Дата рождения/смерти
- Страна

**Структура формы:**

```javascript
const form = reactive({
  name: '',
  birthYear: undefined,
  deathYear: undefined,
  country: '',
  comment: '',
})
```

### 6. Книги (/books/new.vue)

**Особенности:**

- Интеграция с Google Books API
- Загрузка обложки
- Связь с автором
- Год издания
- Количество страниц

**Структура формы:**

```javascript
const form = reactive({
  title: '',
  authorId: '',
  description: '',
  publishedYear: undefined,
  pages: undefined,
  genre: '',
})

const googleBook = (ref < GoogleBook) | (null > null)
const manualTitle = ref('')
```

## Общие компоненты

### 1. PhotoUpload

```vue
<PhotoUpload
  v-model="file"
  v-model:preview="preview"
  label="Постер"
  :error="errors.poster"
  size="lg"
  class="flex-shrink-0"
/>
```

### 2. TmdbMovieSearch/TmdbSeriesSearch/TmdbPersonSearch

```vue
<TmdbMovieSearch
  v-model="tmdbMovie"
  v-model:manual-query="manualTitle"
  label="Название"
  :required="true"
  :error="errors.title"
  placeholder="например, Интерстеллар"
/>
```

### 3. CustomSelect

```vue
<CustomSelect
  v-model="form.directorId"
  :options="directorOptions"
  label="Режиссёр"
  placeholder="Выберите режиссёра"
  class="flex-1"
/>
```

## Паттерны и лучшие практики

### 1. Валидация формы

```javascript
const validateForm = () => {
  const title = tmdbMovie.value?.title || manualTitle.value.trim()
  if (!title) {
    errors.value.title = 'Название обязательно'
    throw new Error('Validation failed')
  }

  if (form.title.length > 200) {
    errors.value.title = 'Название слишком длинное'
    throw new Error('Validation failed')
  }
}
```

### 2. Обработка ошибок

```javascript
const handleErrors = (e: any) => {
  const base = e?.data?.message || e?.message || 'Произошла ошибка'
  const violations = e?.data?.violations

  if (Array.isArray(violations) && violations.length) {
    violations.forEach((v) => {
      errors.value[v.field] = v.message
    })
  }
  error.value = base
}
```

### 3. Подготовка payload

```javascript
const preparePayload = () => {
  const formData = new FormData()

  formData.append('title', title)
  if (form.genre?.trim()) {
    formData.append('genre', form.genre.trim())
  }
  if (photoFile.value) {
    formData.append('poster', photoFile.value)
  }

  return formData
}
```

### 4. Сохранение черновика

```javascript
// Сохранение в localStorage
onMounted(() => {
  const savedData = localStorage.getItem(`${entityType}FormDraft`)
  if (savedData) {
    // Восстановление данных
  }
})

watch(
  [form, manualTitle, tmdbMovie],
  () => {
    localStorage.setItem(`${entityType}FormDraft`, JSON.stringify(dataToSave))
  },
  { deep: true },
)
```

### 5. Интеграция с внешними API

```javascript
watch(tmdbMovie, async (newMovie) => {
  if (newMovie) {
    // Автозаполнение полей из TMDB
    if (newMovie.release_date) {
      form.value.releaseYear = parseInt(newMovie.release_date.slice(0, 4), 10)
    }

    // Загрузка постера
    if (newMovie.poster_path) {
      const url = `https://image.tmdb.org/t/p/w500${newMovie.poster_path}`
      // Загрузка файла
    }
  }
})
```

## Конфигурация для разных сущностей

### Фильмы

```javascript
const entityType = 'movies'
const entityName = 'фильм'
const formDescription = 'Заполните поля ниже, чтобы добавить новый фильм'
const hasPhoto = true
const photoLabel = 'Постер'
const cancelLink = '/movies'
const successRedirect = '/movies'
```

### Сериалы

```javascript
const entityType = 'series'
const entityName = 'сериал'
const formDescription = 'Заполните поля ниже, чтобы добавить новый сериал'
const hasPhoto = true
const photoLabel = 'Постер'
const cancelLink = '/series'
const successRedirect = '/series'
```

### Игры

```javascript
const entityType = 'games'
const entityName = 'игра'
const formDescription = 'Заполните поля ниже, чтобы создать новую запись об игре'
const hasPhoto = false
const cancelLink = '/games'
const successRedirect = '/games'
```

### Режиссёры

```javascript
const entityType = 'directors'
const entityName = 'режиссёра'
const formDescription = 'Заполните поля ниже, чтобы добавить нового режиссёра'
const hasPhoto = true
const photoLabel = 'Фото'
const cancelLink = String($route.query.redirectTo) || '/movies/directors'
const successRedirect = String($route.query.redirectTo) || '/movies/directors'
```

## Стили и классы

### Основные классы

```css
/* Контейнер */
.mx-auto.max-w-7xl

/* Карточка формы */
.rounded-xl.border.border-gray-200.shadow-sm.overflow-hidden

/* Заголовок */
.border-b.border-gray-100.px-6.py-5
.text-xl.md:text-2xl.font-semibold.text-gray-900

/* Поля формы */
.grid.grid-cols-1.gap-6
.grid.grid-cols-1.md:grid-cols-2.gap-6

/* Инпуты */
.block.w-full.rounded-lg.border.border-gray-300.px-3.py-2
.focus:border-indigo-500.focus:ring-2.focus:ring-indigo-200

/* Ошибки */
.border-red-300.focus:ring-red-200
.text-red-600

/* Кнопки */
.inline-flex.items-center.gap-2.rounded-lg.bg-indigo-600
.hover:bg-indigo-700.disabled:opacity-60
```

## Правила именования

### Файлы

- Создание: `/{entity}/new.vue`
- Редактирование: `/{entity}/[id]/edit.vue`

### Переменные

- Форма: `form`
- Ошибки: `errors`
- Файл: `photoFile` / `posterFile`
- Превью: `photoPreview` / `posterPreview`
- Отправка: `submitting`

### localStorage

- Черновик: `{entity}FormDraft`

## Общие принципы

1. **Единообразие** - все страницы следуют одной структуре
2. **Валидация** - клиентская и серверная валидация
3. **Обработка ошибок** - детальные сообщения об ошибках
4. **Сохранение прогресса** - черновики в localStorage
5. **Интеграция API** - автоматическое заполнение полей
6. **Доступность** - семантическая разметка
7. **Адаптивность** - поддержка мобильных устройств

## Пример создания новой сущности

1. Создать страницу `/{entity}/new.vue` по шаблону
2. Определить структуру формы и валидацию
3. Добавить необходимые компоненты
4. Настроить интеграцию с API (если нужно)
5. Добавить обработку ошибок
6. Настроить редиректы

Этот подход обеспечивает консистентность и ускоряет разработку новых модулей.
