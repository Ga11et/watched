<template>
  <div
    class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
  >
    <div class="flex">
      <div class="w-24 h-24 bg-gray-100 flex-shrink-0">
        <img
          v-if="author.photo"
          :src="photoUrl"
          :alt="author.name"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
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

      <div class="flex-1 p-4">
        <h3 class="font-semibold text-gray-900 mb-1">{{ author.name }}</h3>

        <div class="space-y-1 text-sm text-gray-600 mb-3">
          <p v-if="author.birthYear">
            {{ author.birthYear }}{{ author.deathYear ? ` - ${author.deathYear}` : '' }}
          </p>
          <p v-if="author.country">{{ author.country }}</p>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-500">
            <DateDisplay :date="author.createdAt" />
          </span>
          <div class="flex gap-1">
            <NuxtLink
              :to="`/books/authors/${author.id}`"
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
              :to="`/books/authors/${author.id}/edit`"
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
              @click="$emit('delete', author.id)"
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
  createdAt: string
}

interface Props {
  author: Author
}

const props = defineProps<Props>()

defineEmits<{
  delete: [id: string]
}>()

const config = useRuntimeConfig()

const photoUrl = computed(() => {
  if (!props.author.photo) return ''
  return props.author.photo.startsWith('http')
    ? props.author.photo
    : `${config.public.apiUrl}/${props.author.photo}`
})
</script>
