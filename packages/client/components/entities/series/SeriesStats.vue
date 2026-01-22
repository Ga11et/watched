<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">Сериалы</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">
          {{ stats.total }}
        </p>
        <p class="text-xs text-gray-500 mt-1">+{{ stats.thisMonth }} за месяц</p>
      </div>
      <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4"
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
        to="/series"
        class="block w-full text-center px-3 py-2 bg-orange-50 text-orange-600 text-sm font-medium rounded-md hover:bg-orange-100 transition-colors"
      >
        Все сериалы
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SeriesStats {
  total: number
  thisMonth: number
  avgRating?: number
}

interface Props {
  stats: SeriesStats
}

defineProps<Props>()
</script>
