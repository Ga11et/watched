<template>
  <div>
    <div class="mb-6">
      <SortControl :sort-by="sortBy" :sort-order="sortOrder" @update-sorting="handleSortUpdate" />
    </div>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="director in directors"
        :key="director.id"
        class="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
      >
        <h3 class="text-lg font-semibold mb-2">{{ director.fullName }}</h3>
        <p v-if="director.comment" class="text-gray-600 mb-4 text-sm">
          {{ director.comment }}
        </p>
        <NuxtLink
          :to="`/movies/directors/${director.id}`"
          class="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
        >
          Смотреть фильмы
          <svg
            class="w-4 h-4 ml-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SortControl from './SortControl.vue'

interface Director {
  id: string
  fullName: string
  comment?: string | null
}

interface Props {
  directors: Director[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
