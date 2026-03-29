<template>
  <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-gray-600">Книги</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">
          {{ stats.total }}
        </p>
        <p class="text-xs text-gray-500 mt-1">+{{ stats.thisMonth }} за месяц</p>
      </div>
      <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
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
        to="/user-books"
        class="block w-full text-center px-3 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-100 transition-colors"
      >
        Все книги
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface BookStats {
  total: number
  thisMonth: number
  avgRating?: number
}

interface Props {
  stats: BookStats
}

defineProps<Props>()
</script>
