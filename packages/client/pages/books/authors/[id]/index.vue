<template>
  <div class="mx-auto max-w-4xl">
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

    <div v-else-if="author" class="bg-white shadow rounded-lg overflow-hidden">
      <div class="flex flex-col md:flex-row">
        <div class="md:w-1/3">
          <div v-if="author.photo" class="h-96 md:h-full">
            <img :src="photoUrl" :alt="author.name" class="w-full h-full object-cover" />
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>

        <div class="md:w-2/3 p-6">
          <div class="flex justify-between items-start mb-4">
            <h1 class="text-3xl font-bold text-gray-900">{{ author.name }}</h1>
            <div class="flex gap-2">
              <NuxtLink
                :to="`/books/authors/${author.id}/edit`"
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
                @click="deleteAuthor"
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
            <div v-if="author.birthYear" class="flex items-center">
              <span class="text-sm font-medium text-gray-500 mr-2">Год рождения:</span>
              <span class="text-sm text-gray-900">{{ author.birthYear }}</span>
              <span v-if="author.deathYear" class="text-sm text-gray-900">
                - {{ author.deathYear }}</span
              >
            </div>

            <div v-if="author.country" class="flex items-center">
              <span class="text-sm font-medium text-gray-500 mr-2">Страна:</span>
              <span class="text-sm text-gray-900">{{ author.country }}</span>
            </div>

            <div class="flex items-center">
              <span class="text-sm font-medium text-gray-500 mr-2">Добавлен:</span>
              <DateDisplay :date="author.createdAt" />
            </div>

            <div v-if="author.comment" class="pt-4 border-t">
              <h3 class="text-lg font-medium text-gray-900 mb-2">О авторе</h3>
              <p class="text-gray-700 whitespace-pre-wrap">{{ author.comment }}</p>
            </div>

            <!-- Книги автора -->
            <div class="pt-4 border-t">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Книги автора</h3>
              <div v-if="authorBooks.length === 0" class="text-center py-8 text-gray-500">
                <p>У этого автора пока нет книг в коллекции</p>
                <NuxtLink
                  :to="`/books/new?authorId=${author.id}`"
                  class="inline-flex items-center mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                >
                  Добавить книгу
                </NuxtLink>
              </div>
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  v-for="book in authorBooks"
                  :key="book.id"
                  class="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    class="w-12 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center"
                  >
                    <svg
                      class="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <NuxtLink
                      :to="`/books/${book.id}`"
                      class="text-sm font-medium text-gray-900 truncate hover:text-indigo-600"
                    >
                      {{ book.title }}
                    </NuxtLink>
                    <div class="flex items-center space-x-2 mt-1">
                      <span v-if="book.publishedYear" class="text-xs text-gray-500">
                        {{ book.publishedYear }}
                      </span>
                      <span v-if="book.genre" class="text-xs text-indigo-600 font-medium">
                        {{ book.genre }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Author {
  id: string
  name: string
  birthYear?: number
  deathYear?: number
  country?: string
  photo?: string
  comment?: string
  createdAt: string
}

interface Book {
  id: string
  title: string
  publishedYear?: number
  genre?: string
  authorId: string
}

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const {
  data: author,
  loading,
  error,
} = await useFetch<Author>(`/api/authors/${route.params.id}`, {
  baseURL: config.public.apiUrl,
})

const { data: authorBooks } = await useFetch<Book[]>(`/api/books?authorId=${route.params.id}`, {
  baseURL: config.public.apiUrl,
})

const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Книги', to: '/books' },
  { label: 'Авторы', to: '/books/authors' },
  { label: author.value?.name || 'Автор' },
])

const photoUrl = computed(() => {
  if (!author.value?.photo) return ''
  return author.value.photo.startsWith('http')
    ? author.value.photo
    : `${config.public.apiUrl}/${author.value.photo}`
})

const deleteAuthor = async () => {
  if (!confirm('Вы уверены, что хотите удалить этого автора?')) return

  try {
    await $fetch(`/api/authors/${route.params.id}`, {
      baseURL: config.public.apiUrl,
      method: 'DELETE',
    })
    await router.push('/books/authors')
  } catch (err) {
    console.error('Ошибка при удалении автора:', err)
  }
}
</script>
