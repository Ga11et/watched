<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="flex">
      <div v-if="author.photo" class="flex-shrink-0 w-32 h-48">
        <img :src="photoUrl" :alt="author.fullName" class="w-full h-full object-cover" />
      </div>
      <div v-else class="flex-shrink-0 w-32 h-48 bg-gray-100 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-10 w-10 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
          />
        </svg>
      </div>
      <div class="p-4 flex-1">
        <div class="flex justify-between items-start">
          <h3 class="text-lg font-semibold line-clamp-1">
            <NuxtLink
              :to="`/books/authors/${author.id}`"
              class="text-indigo-700 hover:text-indigo-900"
            >
              {{ author.fullName }}
            </NuxtLink>
          </h3>
          <NuxtLink
            :to="`/authors/${author.id}/edit`"
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
        </div>

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
      </div>
    </div>
  </div>
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

const config = useRuntimeConfig()

const photoUrl = computed(() => {
  if (!author.photo) return null
  return `${config.public.apiBase}${author.photo}`
})
</script>
