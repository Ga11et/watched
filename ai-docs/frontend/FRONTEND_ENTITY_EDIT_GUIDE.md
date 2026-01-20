# Документация: Страницы редактирования сущностей

## Обзор

В приложении используется унифицированный подход к созданию страниц редактирования существующих сущностей. Каждая страница редактирования следует общей структуре с учётом специфики конкретной сущности и особенностей работы с существующими данными.

## Структура страницы редактирования

### 1. Основной шаблон

```vue
<template>
  <div class="mx-auto max-w-7xl">
    <!-- Хлебные крошки с названием сущности -->
    <Breadcrumbs :items="breadcrumbItems" />

    <!-- Блок ошибок загрузки -->
    <div v-if="loadError" class="error-block">
      {{ loadError }}
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="pending" class="loading-state">Загрузка...</div>

    <!-- Основная карточка формы -->
    <div v-else class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <!-- Заголовок -->
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl md:text-2xl font-semibold text-gray-900">
          Редактировать {{ entityName }}
        </h1>
        <p class="mt-1 text-sm text-gray-500">{{ formDescription }}</p>
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
            :initial-url="entityData.photo"
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
            {{ submitting ? 'Сохранение...' : 'Сохранить' }}
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
const route = useRoute()
const router = useRouter()

// Состояние
const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})
const loadError = ref('')

// Файлы и превью
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

// Загрузка данных сущности
const { data: entityData, pending } = await useAsyncData(entityType, async () => {
  try {
    loadError.value = ''
    return await $fetch(`${config.public.apiBase}/${entityType}/${route.params.id}`)
  } catch (e) {
    loadError.value = `Не удалось загрузить ${entityName}`
    return null
  }
})

// Данные формы
const form = reactive({
  // Поля формы
})

// Заполнение формы при загрузке данных
watchEffect(() => {
  if (entityData.value) {
    form.title = entityData.value.title
    form.genre = entityData.value.genre || ''
    // ... другие поля
    photoPreview.value = entityData.value.poster
  }
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
    await $fetch(`${config.public.apiBase}/${entityType}/${route.params.id}`, {
      method: 'PUT',
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

## Особенности редактирования

### 1. Загрузка существующих данных

```javascript
const { data: entityData, pending } = await useAsyncData(entityType, async () => {
  try {
    loadError.value = ''
    return await $fetch(`${config.public.apiBase}/${entityType}/${route.params.id}`)
  } catch (e) {
    loadError.value = `Не удалось загрузить ${entityName}`
    return null
  }
})
```

### 2. Заполнение формы данными

```javascript
watchEffect(() => {
  if (entityData.value) {
    form.title = entityData.value.title
    form.genre = entityData.value.genre || ''
    form.rating = entityData.value.rating
    form.comment = entityData.value.comment || ''

    // Установка превью для фото
    if (entityData.value.poster) {
      photoPreview.value = entityData.value.poster
    }
  }
})
```

### 3. Обработка файлов

```javascript
const preparePayload = () => {
  const formData = new FormData()

  formData.append('title', form.title.trim())

  // Добавляем файл только если он изменён
  if (photoFile.value) {
    formData.append('poster', photoFile.value)
  } else if (entityData.value.poster) {
    // Сохраняем существующий постер
    formData.append('existingPoster', entityData.value.poster)
  }

  return formData
}
```

## Типы сущностей и их особенности

### 1. Фильмы (/movies/[id]/edit.vue)

**Особенности:**

- Загрузка существующего постера
- Кнопка поиска в TMDB для обновления данных
- Сохранение существующего постера при отсутствии нового

**Структура формы:**

```javascript
const form = reactive({
  title: '',
  genre: '',
  directorId: '',
  watchedAt: '',
  rating: undefined,
  releaseYear: undefined,
  comment: '',
})

const loadingTmdb = ref(false)
const tmdbError = ref('')
```

**Кнопка TMDB:**

```vue
<button
  type="button"
  @click="loadFromTmdb"
  :disabled="loadingTmdb || !form.title.trim()"
  class="tmdb-button"
>
  <svg v-if="loadingTmdb" class="animate-spin h-4 w-4">...</svg>
  <svg v-else>...</svg>
  TMDB
</button>
```

### 2. Сериалы (/series/[id]/edit.vue)

**Особенности:**

- Аналогично фильмам с TMDB интеграцией
- Загрузка существующего постера
- Обновление данных из TMDB

**Структура формы:**

```javascript
const form = reactive({
  title: '',
  genres: '',
  country: '',
  rating: undefined,
  watchedAt: '',
  comment: '',
})
```

### 3. Игры (/games/[id]/edit.vue)

**Особенности:**

- Простая форма без внешних API
- Гидратация для SSR
- Кнопка возврата к деталям

**Структура формы:**

```javascript
const form = reactive({
  title: '',
  completionDate: '',
  playTimeHours: undefined,
  comment: '',
  rating: undefined,
})

const hydrated = ref(false)

onMounted(() => {
  hydrated.value = true
})
```

### 4. Режиссёры (/movies/directors/[id]/edit.vue)

**Особенности:**

- Простая форма
- Загрузка существующего фото
- Базовые поля для редактирования

**Структура формы:**

```javascript
const form = reactive({
  fullName: '',
  comment: '',
})
```

### 5. Авторы (/books/authors/[id]/edit.vue)

**Особенности:**

- Простая форма
- Даты рождения/смерти
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

### 6. Книги (/books/[id]/edit.vue)

**Особенности:**

- Интеграция с Google Books API
- Загрузка существующей обложки
- Связь с автором

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
const loadingGoogle = ref(false)
```

## Паттерны и лучшие практики

### 1. Обработка состояний загрузки

```vue
<template>
  <!-- Ошибка загрузки -->
  <div v-if="loadError" class="error-block">
    {{ loadError }}
  </div>

  <!-- Индикатор загрузки -->
  <div v-if="pending" class="loading-state">Загрузка...</div>

  <!-- Основной контент -->
  <div v-else>
    <!-- Форма -->
  </div>
</template>
```

### 2. Хлебные крошки с динамическим названием

```javascript
const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Фильмы', to: '/movies' },
  {
    label: entityData.value?.title || 'Загрузка...',
    to: `/movies/${route.params.id}`,
  },
  { label: 'Редактирование' },
])
```

### 3. Кнопка возврата к деталям

```vue
<NuxtLink
  :to="`/${entityType}/${route.params.id}`"
  class="text-sm text-indigo-600 hover:text-indigo-800"
>
  Назад к деталям
</NuxtLink>
```

### 4. Интеграция с TMDB при редактировании

```javascript
const loadFromTmdb = async () => {
  if (!form.title.trim()) return

  loadingTmdb.value = true
  tmdbError.value = ''

  try {
    const results = await $fetch('https://api.themoviedb.org/3/search/movie', {
      params: {
        api_key: config.public.tmdbApiKey,
        query: form.title,
        language: 'ru-RU',
      },
    })

    if (results.results?.length > 0) {
      const movie = results.results[0]
      // Обновление полей из TMDB
      if (movie.release_date) {
        form.releaseYear = parseInt(movie.release_date.slice(0, 4))
      }
      if (movie.genre_ids) {
        // Загрузка жанров
      }
    }
  } catch (e) {
    tmdbError.value = 'Не удалось загрузить данные из TMDB'
  } finally {
    loadingTmdb.value = false
  }
}
```

### 5. Обработка файлов в редактировании

```javascript
const preparePayload = () => {
  const formData = new FormData()

  // Текстовые поля
  formData.append('title', form.title.trim())
  if (form.genre?.trim()) {
    formData.append('genre', form.genre.trim())
  }

  // Файлы - только если изменены
  if (photoFile.value) {
    formData.append('poster', photoFile.value)
  }

  return formData
}
```

### 6. Валидация при редактировании

```javascript
const validateForm = () => {
  if (!form.title.trim()) {
    errors.value.title = 'Название обязательно'
    throw new Error('Validation failed')
  }

  if (form.title.length > 200) {
    errors.value.title = 'Название слишком длинное'
    throw new Error('Validation failed')
  }
}
```

## Конфигурация для разных сущностей

### Фильмы

```javascript
const entityType = 'movies'
const entityName = 'фильм'
const formDescription = 'Измените данные фильма'
const hasPhoto = true
const photoLabel = 'Постер'
const cancelLink = `/movies/${route.params.id}`
const successRedirect = `/movies/${route.params.id}`
```

### Игры

```javascript
const entityType = 'games'
const entityName = 'игра'
const formDescription = 'Обновите поля ниже и сохраните изменения'
const hasPhoto = false
const cancelLink = `/games/${route.params.id}`
const successRedirect = `/games/${route.params.id}`
```

### Режиссёры

```javascript
const entityType = 'directors'
const entityName = 'режиссёра'
const formDescription = 'Измените данные режиссёра'
const hasPhoto = true
const photoLabel = 'Фото'
const cancelLink = `/movies/directors/${route.params.id}`
const successRedirect = `/movies/directors/${route.params.id}`
```

## Отличия от создания сущности

### 1. Загрузка данных

- **Создание**: пустая форма
- **Редактирование**: загрузка существующих данных

### 2. Файлы

- **Создание**: всегда новый файл
- **Редактирование**: опциональная замена файла

### 3. Хлебные крошки

- **Создание**: `Добавление`
- **Редактирование**: `Редактирование` + название сущности

### 4. Кнопки

- **Создание**: `Создать`
- **Редактирование**: `Сохранить`

### 5. Редирект

- **Создание**: на список
- **Редактирование**: на детали сущности

## Общие принципы

1. **Загрузка данных** - предварительная загрузка существующих данных
2. **Сохранение состояния** - сохранение существующих файлов при отсутствии изменений
3. **Валидация** - проверка данных перед отправкой
4. **Обработка ошибок** - детальные сообщения об ошибках
5. **Интеграция API** - обновление данных из внешних источников
6. **Доступность** - семантическая разметка
7. **Адаптивность** - поддержка мобильных устройств

## Пример создания новой страницы редактирования

1. Создать страницу `/{entity}/[id]/edit.vue` по шаблону
2. Добавить загрузку данных сущности
3. Настроить заполнение формы существующими данными
4. Добавить обработку файлов (сохранение существующих)
5. Настроить валидацию и отправку
6. Добавить интеграцию с внешними API (если нужно)

Этот подход обеспечивает консистентность и ускоряет разработку новых модулей редактирования.
