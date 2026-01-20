<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="flex">
      <div v-if="series.poster" class="flex-shrink-0 w-32 h-48">
        <img :src="posterUrl" :alt="series.title" class="w-full h-full object-cover" />
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
          <h3 class="text-lg font-semibold">
            <NuxtLink
              :to="`/series/${series.id}`"
              class="line-clamp-2 leading-none h-9 text-indigo-700 hover:text-indigo-900"
            >
              {{ series.title }}
            </NuxtLink>
          </h3>
          <NuxtLink
            :to="`/series/${series.id}/edit`"
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
          <div v-if="series.genres" class="flex items-center">
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
            <span class="text-gray-500 line-clamp-1">{{ series.genres }}</span>
          </div>
          <div class="flex items-center" v-if="series.watchedAt">
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
            <UiDateDisplay :date="series.watchedAt" />
          </div>
          <div v-if="series.rating != null" class="flex items-center">
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
            {{ Math.round(series.rating) }}/100
          </div>
          <div v-if="series.totalSeasons" class="flex items-center">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span>{{ series.watchedSeasons || 0 }}/{{ series.totalSeasons }} сезонов</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Series {
  id: string
  title: string
  genres?: string | null
  country?: string | null
  rating?: number | null
  comment?: string | null
  totalSeasons?: number | null
  watchedSeasons?: number | null
  watchedAt?: string | null
  poster?: string | null
  createdAt?: string | null
}

const props = defineProps<{ series: Series }>()

const config = useRuntimeConfig()

const posterUrl = computed(() => {
  if (!props.series.poster) return null
  return `${config.public.apiBase}${props.series.poster}`
})
</script>
