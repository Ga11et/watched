<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Книги', to: '/books' },
        { label: book?.title || 'Загрузка...', to: `/books/${route.params.id}` },
        { label: 'Редактирование' },
      ]"
    />

    <div
      v-if="loadError"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ loadError }}
    </div>

    <div v-if="pending" class="text-center py-12 text-gray-500">Загрузка...</div>

    <div v-else class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать книгу</h1>
        <p class="mt-1 text-sm text-gray-500">Измените данные книги</p>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="flex gap-6">
          <UiPhotoUpload
            v-model="coverFile"
            v-model:preview="coverPreview"
            label="Обложка"
            :error="errors.cover"
            size="lg"
            class="flex-shrink-0"
          />

          <div class="flex-1 grid grid-cols-1 gap-6">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700">
                Название<span class="text-red-500">*</span>
              </label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                :class="[
                  'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                  errors.title
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
                ]"
                placeholder="например, Война и мир"
              />
              <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
            </div>

            <div class="flex gap-2">
              <UiSelect
                v-model="form.authorId"
                :options="authorOptions"
                label="Автор"
                placeholder="Выберите автора"
                class="flex-1"
              />
              <NuxtLink
                :to="`/books/authors/new?redirectTo=${encodeURIComponent(`/books/${route.params.id}/edit`)}`"
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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="genre" class="block text-sm font-medium text-gray-700">Жанр</label>
                <input
                  id="genre"
                  v-model.trim="form.genre"
                  type="text"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="например, Роман"
                />
              </div>
              <div>
                <label for="publishYear" class="block text-sm font-medium text-gray-700"
                  >Год издания</label
                >
                <input
                  id="publishYear"
                  v-model.number="form.publishYear"
                  type="number"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="например, 1869"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="pageCount" class="block text-sm font-medium text-gray-700"
                  >Количество страниц</label
                >
                <input
                  id="pageCount"
                  v-model.number="form.pageCount"
                  type="number"
                  min="1"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="например, 1225"
                />
              </div>
              <div>
                <label for="rating" class="block text-sm font-medium text-gray-700"
                  >Оценка (0-100)</label
                >
                <input
                  id="rating"
                  v-model.number="form.rating"
                  type="number"
                  min="0"
                  max="100"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="например, 95"
                />
              </div>
            </div>

            <div>
              <label for="readAt" class="block text-sm font-medium text-gray-700"
                >Дата прочтения</label
              >
              <input
                id="readAt"
                v-model="form.readAt"
                type="date"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label for="comment" class="block text-sm font-medium text-gray-700"
                >Комментарий</label
              >
              <textarea
                id="comment"
                v-model="form.comment"
                rows="3"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Ваши впечатления от книги"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink
            :to="`/books/${route.params.id}`"
            class="rounded-lg px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Отмена
          </NuxtLink>
          <button
            type="submit"
            :disabled="submitting"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              v-if="submitting"
              class="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>{{ submitting ? 'Сохранение...' : 'Сохранить' }}</span>
          </button>
        </div>

        <div
          v-if="error"
          class="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Author, Book } from '~/types/api'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const loadError = ref('')
const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

interface BookForm {
  title: string
  authorId: string
  genre: string
  publishYear: number | undefined
  pageCount: number | undefined
  rating: number | undefined
  readAt: string
  comment: string
}

const form = ref<BookForm>({
  title: '',
  authorId: '',
  genre: '',
  publishYear: undefined,
  pageCount: undefined,
  rating: undefined,
  readAt: '',
  comment: '',
})

const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)

const authorOptions = computed(() => [
  { value: '', label: 'Выберите автора' },
  ...(authors.value?.map((a) => ({ value: a.id, label: a.fullName })) || []),
])

const { data: authors } = await useAsyncData<Author[]>('authors-list-edit', async () => {
  try {
    return await _fetch(`${config.public.apiBase}/authors`)
  } catch {
    return []
  }
})

const { data: book, pending } = await useAsyncData(
  `book-edit-${route.params.id}`,
  async () => {
    try {
      loadError.value = ''
      const data = await _fetch<Book>(`${config.public.apiBase}/books/${route.params.id}`)

      form.value.title = data.title || ''
      form.value.authorId = data.author?.id || ''
      form.value.genre = data.genre || ''
      form.value.publishYear = typeof data.publishYear === 'number' ? data.publishYear : undefined
      form.value.pageCount = typeof data.pageCount === 'number' ? data.pageCount : undefined
      form.value.rating = typeof data.rating === 'number' ? data.rating : undefined
      form.value.readAt = data.readAt ? String(data.readAt).slice(0, 10) : ''
      form.value.comment = data.comment || ''
      if (data.cover) {
        coverPreview.value = data.cover.startsWith('http')
          ? data.cover
          : `${config.public.apiBase}${data.cover}`
      }

      return data
    } catch (e: any) {
      loadError.value = e?.data?.message || 'Не удалось загрузить книгу'
      return null
    }
  },
  { server: false },
)

const onSubmit = async () => {
  if (submitting.value) return

  try {
    submitting.value = true
    errors.value = {}
    error.value = ''

    const title = form.value.title.trim()
    if (!title) {
      errors.value.title = 'Название обязательно'
      return
    }

    const formData = new FormData()
    formData.append('title', title)
    if (form.value.authorId) {
      formData.append('authorId', form.value.authorId)
    }
    if (form.value.genre?.trim()) {
      formData.append('genre', form.value.genre.trim())
    }
    if (typeof form.value.publishYear === 'number') {
      formData.append('publishYear', String(form.value.publishYear))
    }
    if (typeof form.value.pageCount === 'number') {
      formData.append('pageCount', String(form.value.pageCount))
    }
    if (typeof form.value.rating === 'number') {
      formData.append('rating', String(form.value.rating))
    }
    if (form.value.readAt) {
      formData.append('readAt', form.value.readAt)
    }
    if (form.value.comment?.trim()) {
      formData.append('comment', form.value.comment.trim())
    }
    if (coverFile.value) {
      formData.append('cover', coverFile.value)
    } else if (book.value?.cover && !coverPreview.value) {
      formData.append('removeCover', 'true')
    }

    await _fetch(`${config.public.apiBase}/books/${route.params.id}`, {
      method: 'PUT',
      body: formData,
    })

    await router.push(`/books/${route.params.id}`)
  } catch (e) {
    const err = e as {
      data?: { message?: string; violations?: Array<{ field: string; message: string }> }
    }
    const base = err.data?.message
    const violations = err.data?.violations

    if (Array.isArray(violations) && violations.length) {
      violations.forEach((v) => {
        errors.value[v.field] = v.message
      })
    }
    error.value = base ?? 'Произошла ошибка при обновлении книги'
  } finally {
    submitting.value = false
  }
}
</script>
