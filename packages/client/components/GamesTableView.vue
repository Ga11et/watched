<template>
  <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
    <table class="min-w-full divide-y divide-gray-200 text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th
            scope="col"
            class="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
            @click="handleSort('title')"
          >
            <div class="flex items-center gap-1">
              Название
              <span class="inline-block w-4 h-4 flex items-center justify-start">
                <span v-if="sortBy === 'title'" class="text-gray-700">
                  <svg
                    v-if="sortOrder === 'ASC'"
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3L5 8H15L10 3Z" />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 17L5 12H15L10 17Z" />
                  </svg>
                </span>
                <span v-else class="text-gray-400">
                  <svg
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3L5 8H15L10 3ZM10 17L15 12H5L10 17Z" />
                  </svg>
                </span>
              </span>
            </div>
          </th>
          <th
            scope="col"
            class="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
            @click="handleSort('completionDate')"
          >
            <div class="flex items-center gap-1">
              Дата прохождения
              <span class="inline-block w-4 h-4 flex items-center justify-start">
                <span v-if="sortBy === 'completionDate'" class="text-gray-700">
                  <svg
                    v-if="sortOrder === 'ASC'"
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3L5 8H15L10 3Z" />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 17L5 12H15L10 17Z" />
                  </svg>
                </span>
                <span v-else class="text-gray-400">
                  <svg
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3L5 8H15L10 3ZM10 17L15 12H5L10 17Z" />
                  </svg>
                </span>
              </span>
            </div>
          </th>
          <th
            scope="col"
            class="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
            @click="handleSort('playTimeHours')"
          >
            <div class="flex items-center gap-1">
              Время (ч)
              <span class="inline-block w-4 h-4 flex items-center justify-start">
                <span v-if="sortBy === 'playTimeHours'" class="text-gray-700">
                  <svg
                    v-if="sortOrder === 'ASC'"
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3L5 8H15L10 3Z" />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 17L5 12H15L10 17Z" />
                  </svg>
                </span>
                <span v-else class="text-gray-400">
                  <svg
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3L5 8H15L10 3ZM10 17L15 12H5L10 17Z" />
                  </svg>
                </span>
              </span>
            </div>
          </th>
          <th
            scope="col"
            class="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
            @click="handleSort('rating')"
          >
            <div class="flex items-center gap-1">
              Оценка
              <span class="inline-block w-4 h-4 flex items-center justify-start">
                <span v-if="sortBy === 'rating'" class="text-gray-700">
                  <svg
                    v-if="sortOrder === 'ASC'"
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3L5 8H15L10 3Z" />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 17L5 12H15L10 17Z" />
                  </svg>
                </span>
                <span v-else class="text-gray-400">
                  <svg
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3L5 8H15L10 3ZM10 17L15 12H5L10 17Z" />
                  </svg>
                </span>
              </span>
            </div>
          </th>
          <th scope="col" class="px-4 py-3 text-right font-medium text-gray-700">Действия</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        <tr v-for="game in games" :key="game.id" class="hover:bg-gray-50">
          <td class="px-4 py-3">
            <NuxtLink :to="`/games/${game.id}`" class="font-medium text-indigo-700 hover:underline">
              {{ game.title }}
            </NuxtLink>
          </td>
          <td class="px-4 py-3 text-gray-700">
            <DateDisplay :date="game.completionDate" />
          </td>
          <td class="px-4 py-3 text-gray-700">
            {{ game.playTimeHours ?? '—' }}
          </td>
          <td class="px-4 py-3 text-gray-700">
            {{ game.rating ?? '—' }}
          </td>
          <td class="px-4 py-3">
            <div class="flex justify-end gap-2">
              <NuxtLink
                :to="`/games/${game.id}/edit`"
                class="inline-flex items-center rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Редактировать
              </NuxtLink>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import DateDisplay from './DateDisplay.vue'

interface Game {
  id: string
  title: string
  completionDate?: string | null
  playTimeHours?: number | null
  comment?: string | null
  rating?: number | null
}

interface Props {
  games: Game[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const handleSort = (field: string) => {
  emit('update-sorting', field)
}
</script>
