<template>
  <EntitiesCommonCard>
    <template #image>
      <div v-if="game.cover" class="flex-shrink-0 w-32 h-48">
        <img :src="coverUrl" :alt="game.title" class="w-full h-full object-cover" />
      </div>
      <div v-else class="flex-shrink-0 w-32 h-48 bg-gray-100 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    </template>

    <template #title>
      <h3 class="text-lg font-semibold line-clamp-1">
        <NuxtLink :to="`/games/${game.id}`" class="text-indigo-700 hover:text-indigo-900">
          {{ game.title }}
        </NuxtLink>
      </h3>
    </template>

    <template #actions>
      <div class="flex space-x-2">
        <NuxtLink
          :to="`/games/${game.id}/edit`"
          class="text-indigo-600 hover:text-indigo-800"
          aria-label="Edit"
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
    </template>

    <template #content>
      <div class="mt-4 text-sm text-gray-600 space-y-2">
        <div class="flex items-center" v-if="game.completionDate">
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
          <UiDateDisplay :date="game.completionDate" />
        </div>
        <div class="flex items-center" v-if="game.playTimeHours != null">
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {{ formatHours(game.playTimeHours) }} ч
        </div>
        <div v-if="game.rating" class="flex items-center">
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
          {{ game.rating }}/100
        </div>
      </div>
    </template>
  </EntitiesCommonCard>
</template>

<script setup lang="ts">
interface Game {
  id: string
  title: string
  completionDate?: string | null
  playTimeHours?: number | null
  comment?: string | null
  rating?: number | null
  cover?: string | null
}

const { game } = defineProps<{ game: Game; disabled?: boolean }>()
const emit = defineEmits<{ (e: 'delete', id: Game['id']): void }>()

const config = useRuntimeConfig()

const coverUrl = computed(() => {
  if (!game.cover) return null
  return `${config.public.apiBase}${game.cover}`
})

function formatHours(hours?: number | null) {
  if (hours == null) return '—'
  return hours % 1 === 0 ? Math.floor(hours) : hours
}
</script>
