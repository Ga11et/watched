<template>
  <EntitiesCommonCard>
    <template #image>
      <div v-if="book.cover" class="flex-shrink-0 w-32 h-48">
        <img :src="coverUrl" :alt="book.title" class="w-full h-full object-cover" />
      </div>
      <div v-else class="flex-shrink-0 w-32 h-48 bg-gray-100 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
    </template>

    <template #title>
      <h3 class="text-lg font-semibold line-clamp-1">
        <NuxtLink :to="`/books/${book.id}`" class="text-indigo-700 hover:text-indigo-900">
          {{ book.title }}
        </NuxtLink>
      </h3>
    </template>

    <template #actions>
      <NuxtLink
        :to="`/books/${book.id}/edit`"
        class="text-indigo-600 hover:text-indigo-800"
        aria-label="Редактировать"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
          />
        </svg>
      </NuxtLink>
    </template>

    <template #content>
      <div class="mt-2 text-sm text-gray-600 space-y-1">
        <div v-if="book.author" class="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-2 text-gray-400 min-w-4"
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
          <span class="text-gray-500 line-clamp-1">{{ book.author.fullName }}</span>
        </div>
        <div v-if="book.genre" class="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-2 text-gray-400 min-w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          <span class="text-gray-500 line-clamp-1">{{ book.genre }}</span>
        </div>
        <div class="flex items-center" v-if="book.readAt">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <UiDateDisplay :date="book.readAt" />
        </div>
        <div v-if="book.rating != null" class="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-2 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          {{ book.rating }}/100
        </div>
        <div v-if="book.publishYear" class="text-xs text-gray-500">
          Год издания: {{ book.publishYear }}
        </div>
      </div>
    </template>
  </EntitiesCommonCard>
</template>

<script setup lang="ts">
import type { Book } from '~/types/api'

const { book } = defineProps<{ book: Book }>()

const config = useRuntimeConfig()

const coverUrl = computed(() => {
  if (!book.cover) return null
  return `${config.public.apiBase}${book.cover}`
})
</script>
