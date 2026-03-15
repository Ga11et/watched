<template>
  <EntitiesCommonCard>
    <template #image>
      <div v-if="userBook.book.cover" class="h-48 w-32 flex-shrink-0">
        <img :src="coverUrl" :alt="userBook.book.title" class="h-full w-full object-cover" />
      </div>
      <div v-else class="flex h-48 w-32 flex-shrink-0 items-center justify-center bg-gray-100">
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
      <h3 class="line-clamp-1 text-lg font-semibold">
        <NuxtLink :to="`/user-books/${userBook.id}`" class="text-indigo-700 hover:text-indigo-900">
          {{ userBook.book.title }}
        </NuxtLink>
      </h3>
    </template>

    <template #actions>
      <NuxtLink
        :to="`/user-books/${userBook.id}/edit`"
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
      <div class="mt-2 space-y-1 text-sm text-gray-600">
        <div v-if="userBook.book.author" class="line-clamp-1 text-gray-500">
          Автор: {{ userBook.book.author.fullName }}
        </div>
        <div v-if="userBook.book.genre" class="line-clamp-1 text-gray-500">
          Жанр: {{ userBook.book.genre }}
        </div>
        <div v-if="userBook.rating != null">Оценка: {{ userBook.rating }}/100</div>
        <div v-if="userBook.readAt" class="flex items-center gap-2">
          <span>Прочитано:</span>
          <UiDateDisplay :date="userBook.readAt" />
        </div>
        <div v-if="userBook.comment" class="line-clamp-2 text-gray-500">
          {{ userBook.comment }}
        </div>
      </div>
    </template>
  </EntitiesCommonCard>
</template>

<script setup lang="ts">
import type { UserBook } from '~/types/api'

const { userBook } = defineProps<{ userBook: UserBook }>()
const config = useRuntimeConfig()

const coverUrl = computed(() => {
  if (!userBook.book.cover) return ''
  return userBook.book.cover.startsWith('http')
    ? userBook.book.cover
    : `${config.public.apiBase}${userBook.book.cover}`
})
</script>
