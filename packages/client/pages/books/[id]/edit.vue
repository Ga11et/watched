<template>
  <div class="mx-auto max-w-2xl">
    <Breadcrumbs :items="breadcrumbItems" />

    <div v-if="loading" class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
      ></div>
    </div>

    <div v-else-if="error" class="text-center py-8">
      <div class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ error }}
      </div>
    </div>

    <div v-else-if="book" class="bg-white shadow rounded-lg p-6">
      <h2 class="text-2xl font-bold mb-6">Редактировать книгу</h2>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div
          v-if="submitError"
          class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ submitError }}
        </div>

        <div>
          <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
            Название книги *
          </label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :class="{ 'border-red-500': errors?.title }"
          />
          <p v-if="errors?.title" class="mt-1 text-sm text-red-600">
            {{ errors.title }}
          </p>
        </div>

        <div>
          <label for="author" class="block text-sm font-medium text-gray-700 mb-1"> Автор * </label>
          <select
            id="author"
            v-model="form.authorId"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :class="{ 'border-red-500': errors?.authorId }"
          >
            <option value="">Выберите автора</option>
            <option v-for="author in authors" :key="author.id" :value="author.id">
              {{ author.name }}
            </option>
          </select>
          <p v-if="errors?.authorId" class="mt-1 text-sm text-red-600">
            {{ errors.authorId }}
          </p>
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
            Описание
          </label>
          <textarea
            id="description"
            v-model="form.description"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="publishedYear" class="block text-sm font-medium text-gray-700 mb-1">
              Год издания
            </label>
            <input
              id="publishedYear"
              v-model.number="form.publishedYear"
              type="number"
              min="1000"
              :max="new Date().getFullYear()"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label for="pages" class="block text-sm font-medium text-gray-700 mb-1">
              Количество страниц
            </label>
            <input
              id="pages"
              v-model.number="form.pages"
              type="number"
              min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label for="genre" class="block text-sm font-medium text-gray-700 mb-1"> Жанр </label>
          <input
            id="genre"
            v-model="form.genre"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="например: Фантастика, Детектив, Роман"
          />
        </div>

        <div>
          <label for="cover" class="block text-sm font-medium text-gray-700 mb-1"> Обложка </label>
          <PhotoUpload
            v-model="form.cover"
            :initial-url="book.cover"
            accept="image/*"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-3">
          <NuxtLink
            :to="`/books/${route.params.id}`"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </NuxtLink>
          <button
            type="submit"
            :disabled="submitting"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <span v-if="submitting">Сохранение...</span>
            <span v-else>Сохранить</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Author {
  id: string
  name: string
}

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
}

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const {
  data: book,
  loading,
  error,
} = await useFetch<Book>(`/api/books/${route.params.id}`, {
  baseURL: config.public.apiUrl,
})

const { data: authors } = await useFetch<Author[]>('/api/authors', {
  baseURL: config.public.apiUrl,
})

const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Книги', to: '/books' },
  { label: book.value?.title || 'Книга', to: `/books/${route.params.id}` },
  { label: 'Редактирование' },
])

const form = ref({
  title: '',
  authorId: '',
  description: '',
  publishedYear: undefined as number | undefined,
  pages: undefined as number | undefined,
  genre: '',
  cover: '',
})

const submitting = ref(false)
const submitError = ref('')
const errors = ref<Record<string, string> | null>(null)

// Заполняем форму данными книги при загрузке
watchEffect(() => {
  if (book.value) {
    form.value = {
      title: book.value.title,
      authorId: book.value.author?.id || '',
      description: book.value.description || '',
      publishedYear: book.value.publishedYear,
      pages: book.value.pages,
      genre: book.value.genre || '',
      cover: book.value.cover || '',
    }
  }
})

const handleSubmit = async () => {
  submitting.value = true
  submitError.value = ''
  errors.value = null

  try {
    await $fetch(`/api/books/${route.params.id}`, {
      baseURL: config.public.apiUrl,
      method: 'PUT',
      body: {
        title: form.value.title.trim(),
        authorId: form.value.authorId,
        description: form.value.description?.trim() || undefined,
        publishedYear: form.value.publishedYear || undefined,
        pages: form.value.pages || undefined,
        genre: form.value.genre?.trim() || undefined,
        cover: form.value.cover || undefined,
      },
    })

    await router.push(`/books/${route.params.id}`)
  } catch (err: any) {
    if (err.data?.violations) {
      errors.value = {}
      err.data.violations.forEach((violation: any) => {
        errors.value![violation.field] = violation.message
      })
      submitError.value = err.data.message || 'Произошла ошибка при обновлении книги'
    } else {
      submitError.value = 'Произошла ошибка при обновлении книги'
    }
  } finally {
    submitting.value = false
  }
}
</script>
