<template>
  <div>
    <div class="mb-6">
      <SortControl :sort-by="sortBy" :sort-order="sortOrder" @update-sorting="handleSortUpdate" />
    </div>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MovieCard from './MovieCard.vue'
import SortControl from './SortControl.vue'

interface Movie {
  id: string
  title: string
  watchDate?: string | null
  comment?: string | null
  rating?: number | null
  director: {
    id: string
    fullName: string
  }
}

interface Props {
  movies: Movie[]
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
