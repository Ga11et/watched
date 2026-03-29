<template>
  <EntitiesCommonCard>
    <template #image>
      <EntitiesBooksOutputsCover
        :cover="userBook.book.cover"
        :alt="userBook.book.title"
        size="sm"
      />
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
        <div v-if="userBook.book.authors?.length" class="line-clamp-1 text-gray-500">
          Автор: {{ userBook.book.authors[0]?.fullName }}
        </div>
        <div v-if="userBook.book.genre" class="line-clamp-1 text-gray-500">
          Жанр: {{ userBook.book.genre }}
        </div>
        <div v-if="userBook.rating != null">Оценка: {{ userBook.rating }}/100</div>
        <div v-if="userBook.readAt" class="flex items-center gap-2">
          <span>Прочитано:</span>
          <UiDateDisplay :date="userBook.readAt" />
        </div>
      </div>
    </template>
  </EntitiesCommonCard>
</template>

<script setup lang="ts">
import type { UserBook } from '~/types/api'

const { userBook } = defineProps<{ userBook: UserBook }>()
</script>
