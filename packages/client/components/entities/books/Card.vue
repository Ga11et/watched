<template>
  <div
    class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
  >
    <div class="aspect-[3/4] bg-gray-100 relative">
      <img v-if="book.cover" :src="coverUrl" :alt="book.title" class="w-full h-full object-cover" />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16"
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

    <div class="p-4">
      <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">{{ book.title }}</h3>

      <p v-if="book.author" class="text-sm text-gray-600 mb-2">
        {{ book.author.name }}
      </p>

      <div class="flex flex-wrap gap-2 mb-3">
        <span
          v-if="book.genre"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
        >
          {{ book.genre }}
        </span>
        <span
          v-if="book.publishedYear"
          class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
        >
          {{ book.publishedYear }}
        </span>
      </div>

      <div class="flex justify-between items-center">
        <span class="text-xs text-gray-500">
          <DateDisplay :date="book.createdAt" />
        </span>
        <div class="flex gap-1">
          <NuxtLink
            :to="`/books/${book.id}`"
            class="inline-flex items-center p-1.5 text-gray-600 hover:text-indigo-600 transition-colors"
            title="Просмотр"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </NuxtLink>
          <NuxtLink
            :to="`/books/${book.id}/edit`"
            class="inline-flex items-center p-1.5 text-gray-600 hover:text-indigo-600 transition-colors"
            title="Редактировать"
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </NuxtLink>
          <button
            @click="$emit('delete', book.id)"
            class="inline-flex items-center p-1.5 text-gray-600 hover:text-red-600 transition-colors"
            title="Удалить"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
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

interface Props {
  book: Book
}

const props = defineProps<Props>()

defineEmits<{
  delete: [id: string]
}>()

const config = useRuntimeConfig()

const coverUrl = computed(() => {
  if (!props.book.cover) return ''
  return props.book.cover.startsWith('http')
    ? props.book.cover
    : `${config.public.apiUrl}/${props.book.cover}`
})
</script>
