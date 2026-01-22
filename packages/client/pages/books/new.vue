<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs :items="breadcrumbItems" />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить книгу</h1>
          <p class="mt-1 text-sm text-gray-500">Заполните поля ниже, чтобы добавить новую книгу</p>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="flex gap-6">
          <UiPhotoUpload
            v-model="photoFile"
            v-model:preview="photoPreview"
            label="Обложка"
            :error="errors.cover"
            class="flex-shrink-0"
          />

          <div class="flex-1 space-y-6">
            <!-- Основная информация -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                  Название
                </label>
                <IntegrationsBookAutocomplete
                  id="title"
                  v-model="selectedBook"
                  v-model:manual-query="form.title"
                  placeholder="Найти книгу..."
                  :error="errors?.title"
                  @select="onBookSelect"
                />
              </div>

              <div class="flex gap-2">
                <UiSelect
                  v-model="form.authorId"
                  :options="authorOptions"
                  label="Автор"
                  placeholder="Выберите автора"
                  class="flex-1"
                  :error="errors?.authorId"
                />
                <NuxtLink
                  to="/books/authors/new?redirectTo=/books/new"
                  class="mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Новый
                </NuxtLink>
              </div>
            </div>

            <!-- Описание -->
            <div>
              <label for="comment" class="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                id="comment"
                v-model="form.comment"
                rows="4"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Ваши впечатления о книге..."
              ></textarea>
            </div>

            <!-- Детали книги -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-4">Детали книги</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="publishYear" class="block text-sm font-medium text-gray-700 mb-1">
                    Год издания
                  </label>
                  <input
                    id="publishYear"
                    v-model.number="form.publishYear"
                    type="number"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="например: 2023"
                  />
                </div>

                <div>
                  <label for="pageCount" class="block text-sm font-medium text-gray-700 mb-1">
                    Количество страниц
                  </label>
                  <input
                    id="pageCount"
                    v-model.number="form.pageCount"
                    type="number"
                    min="1"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="например: 350"
                  />
                </div>
              </div>
            </div>

            <!-- Классификация и оценка -->
            <div>
              <h3 class="text-lg font-medium text-gray-900 mb-4">Классификация и оценка</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label for="genre" class="block text-sm font-medium text-gray-700 mb-1">
                    Жанр
                  </label>
                  <input
                    id="genre"
                    v-model="form.genre"
                    type="text"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="например: Фантастика, Детектив"
                  />
                </div>

                <div>
                  <label for="rating" class="block text-sm font-medium text-gray-700 mb-1">
                    Рейтинг
                  </label>
                  <input
                    id="rating"
                    v-model.number="form.rating"
                    type="number"
                    min="0"
                    max="100"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="0-100"
                  />
                </div>

                <div>
                  <label for="readAt" class="block text-sm font-medium text-gray-700 mb-1">
                    Дата прочтения
                  </label>
                  <input
                    id="readAt"
                    v-model="form.readAt"
                    type="date"
                    class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink
            to="/books"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </NuxtLink>
          <button
            type="submit"
            :disabled="submitting"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {{ submitting ? 'Сохранение...' : 'Создать' }}
          </button>
        </div>

        <div
          v-if="error"
          class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GoogleBook } from '~/components/integrations/google-books.service'
import type { Author } from '~/types/api'

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

// Выбранная книга из автокомплита
const selectedBook = ref<GoogleBook | null>(null)

// 3. Загрузка данных
const { data: authors } = await useFetch<Author[]>(`${useRuntimeConfig().public.apiBase}/authors`)

// Вычисляемые свойства
const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Книги', to: '/books' },
  { label: 'Новая книга' },
])

const authorOptions = computed(() => [
  { value: '', label: 'Выберите автора' },
  ...(authors.value || []).map((author) => ({
    value: author.id,
    label: author.fullName,
  })),
])

// Данные формы
const form = reactive({
  title: '',
  authorId: '',
  comment: '',
  publishYear: undefined as number | undefined,
  pageCount: undefined as number | undefined,
  genre: '',
  rating: undefined as number | undefined,
  readAt: new Date().toISOString().split('T')[0], // Сегодняшняя дата по умолчанию
})

// Обработка выбора книги из Google Books
const onBookSelect = (book: GoogleBook) => {
  // Заполняем название
  form.title = book.title

  // Заполняем описание
  if (book.description) {
    form.comment = book.description
  }

  // Заполняем год издания
  if (book.publishedDate) {
    const year = parseInt(book.publishedDate)
    if (!isNaN(year) && year > 1800 && year <= new Date().getFullYear()) {
      form.publishYear = year
    }
  }

  // Заполняем количество страниц
  if (book.pageCount && book.pageCount > 0) {
    form.pageCount = book.pageCount
  }

  // Заполняем жанры
  if (book.genres) {
    form.genre = book.genres
  }

  // Устанавливаем обложку если есть
  if (book.cover && !photoFile.value) {
    // Загружаем обложку через проксю Nuxt чтобы избежать CORS
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(book.cover)}`
    fetch(proxyUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
        photoFile.value = file
        photoPreview.value = book.cover || null
      })
      .catch((error) => {
        console.warn('Failed to fetch book cover:', error)
      })
  }
}

// Валидация
const validateForm = () => {
  errors.value = {}

  if (!form.title.trim()) {
    errors.value.title = 'Название книги обязательно'
    throw new Error('Validation failed')
  }

  if (form.title.length > 200) {
    errors.value.title = 'Название слишком длинное'
    throw new Error('Validation failed')
  }
}

// Подготовка payload
const preparePayload = () => {
  const formData = new FormData()

  formData.append('title', form.title.trim())

  if (form.authorId) {
    formData.append('authorId', form.authorId)
  }

  if (form.comment?.trim()) {
    formData.append('comment', form.comment.trim())
  }

  if (form.publishYear) {
    formData.append('publishYear', form.publishYear.toString())
  }

  if (form.pageCount) {
    formData.append('pageCount', form.pageCount.toString())
  }

  if (form.genre?.trim()) {
    formData.append('genre', form.genre.trim())
  }

  if (form.rating !== undefined && form.rating !== null) {
    formData.append('rating', form.rating.toString())
  }

  if (form.readAt) {
    formData.append('readAt', form.readAt)
  }

  if (photoFile.value) {
    formData.append('cover', photoFile.value)
  }

  return formData
}

// Обработка ошибок
const handleErrors = (e: any) => {
  const base = e?.data?.message || e?.message || 'Произошла ошибка при создании книги'
  const violations = e?.data?.violations

  if (Array.isArray(violations) && violations.length) {
    violations.forEach((v) => {
      errors.value[v.field] = v.message
    })
  }
  error.value = base
}

// Отправка формы
const onSubmit = async () => {
  if (submitting.value) return

  submitting.value = true
  errors.value = {}
  error.value = ''

  try {
    validateForm()

    const payload = preparePayload()

    await $fetch(`${config.public.apiBase}/books`, {
      method: 'POST',
      body: payload,
    })

    await router.push('/books')
  } catch (e: any) {
    handleErrors(e)
  } finally {
    submitting.value = false
  }
}
</script>
