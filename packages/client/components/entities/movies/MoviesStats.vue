<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">Фильмы</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">
          {{ stats.total }}
        </p>
        <p class="text-xs text-gray-500 mt-1">+{{ stats.thisMonth }} за месяц</p>
      </div>
      <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"
          />
        </svg>
      </div>
    </div>
    <div class="mt-4 flex items-center text-xs text-gray-500">
      <span>Средняя оценка:</span>
      <span class="ml-1 font-medium text-gray-700">
        {{ stats.avgRating?.toFixed(1) || '0' }}/100
      </span>
    </div>
    <div class="mt-4">
      <NuxtLink
        to="/user-movies"
        class="block w-full text-center px-3 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-md hover:bg-indigo-100 transition-colors"
      >
        Все фильмы
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserMovieStats } from '~/types/api'

interface Props {
  stats: UserMovieStats
}

defineProps<Props>()
</script>
