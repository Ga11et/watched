<template>
  <div class="mx-auto max-w-4xl">
    <LayoutBreadcrumbs :items="breadcrumbItems" />

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

    <div v-else-if="book" class="bg-white shadow rounded-lg overflow-hidden">
      <div class="flex flex-col md:flex-row">
        <div class="md:w-1/3">
          <div v-if="book.cover" class="h-96 md:h-full">
            <img :src="coverUrl" :alt="book.title" class="w-full h-full object-cover" />
          </div>
          <div v-else class="h-96 md:h-full bg-gray-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-24 w-24 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        </div>

        <div class="md:w-2/3 p-6">
          <div class="flex justify-between items-center mb-4">
            <h1 class="text-3xl font-bold text-gray-900">{{ book.title }}</h1>
            <div class="flex gap-2">
              <NuxtLink
                :to="`/books/${book.id}/edit`"
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                  />
                </svg>
                Редактировать
              </NuxtLink>
              <button
                @click="deleteBook"
                class="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                Удалить
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <div v-if="book.author" class="flex items-center">
              <span class="text-sm font-medium text-gray-500 mr-2">Автор:</span>
              <NuxtLink
                :to="`/books/authors/${book.author.id}`"
                class="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {{ book.author.name }}
              </NuxtLink>
            </div>

            <div v-if="book.publishedYear" class="flex items-center">
              <span class="text-sm font-medium text-gray-500 mr-2">Год издания:</span>
              <span class="text-sm text-gray-900">{{ book.publishedYear }}</span>
            </div>

            <div v-if="book.genre" class="flex items-center">
              <span class="text-sm font-medium text-gray-500 mr-2">Жанр:</span>
              <span class="text-sm text-gray-900">{{ book.genre }}</span>
            </div>

            <div v-if="book.pages" class="flex items-center">
              <span class="text-sm font-medium text-gray-500 mr-2">Количество страниц:</span>
              <span class="text-sm text-gray-900">{{ book.pages }}</span>
            </div>

            <div class="flex items-center">
              <span class="text-sm font-medium text-gray-500 mr-2">Добавлена:</span>
              <UIDateDisplay :date="book.createdAt" />
            </div>

            <div v-if="book.description" class="pt-4 border-t">
              <h3 class="text-lg font-medium text-gray-900 mb-2">Описание</h3>
              <p class="text-gray-700 whitespace-pre-wrap">{{ book.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Импорты только для типов, утилит, composables
// Компоненты доступны благодаря auto-imports

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

// 1. Конфигурация
definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

// 2. Загрузка данных
// Для страницы деталей сортировка не применяется, загружаем книгу по ID
const {
  data: book,
  pending: loading,
  error,
} = await useFetch<Book>(`${useRuntimeConfig().public.apiBase}/api/books/${route.params.id}`, {})

// 3. Вычисляемые свойства
const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Книги', to: '/books' },
  { label: book.value?.title || 'Книга' },
])

const coverUrl = computed(() => {
  if (!book.value?.cover) return ''
  return book.value.cover.startsWith('http')
    ? book.value.cover
    : `${config.public.apiUrl}/${book.value.cover}`
})

// 4. Методы
const deleteBook = async () => {
  if (!confirm('Вы уверены, что хотите удалить эту книгу?')) return

  try {
    await $fetch(`/api/books/${route.params.id}`, {
      baseURL: config.public.apiUrl,
      method: 'DELETE',
    })
    await router.push('/books')
  } catch (err) {
    console.error('Ошибка при удалении книги:', err)
  }
}
</script>
