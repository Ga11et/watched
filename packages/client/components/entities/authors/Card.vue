<template>
  <EntitiesCommonCard>
    <template #image>
      <EntitiesAuthorsOutputsCover :photo="author.photo" :alt="author.fullName" size="sm" />
    </template>

    <template #title>
      <h3 class="text-lg font-semibold line-clamp-1">
        <NuxtLink :to="`/books/authors/${author.id}`" class="text-indigo-700 hover:text-indigo-900">
          {{ author.fullName }}
        </NuxtLink>
      </h3>
    </template>

    <template #actions>
      <NuxtLink
        :to="`/books/authors/${author.id}/edit`"
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
        <div v-if="author.comment" class="flex items-center">
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
          <span class="text-gray-500 line-clamp-1">{{ author.comment }}</span>
        </div>
        <div class="flex items-center">
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
          <UiDateDisplay :date="author.createdAt" />
        </div>
      </div>
    </template>
  </EntitiesCommonCard>
</template>

<script setup lang="ts">
interface Author {
  id: string
  fullName: string
  comment?: string | null
  photo?: string | null
  createdAt: string
  updatedAt: string
}

const { author } = defineProps<{ author: Author }>()
</script>
