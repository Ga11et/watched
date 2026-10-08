<template>
  <div>
    <div class="mb-6">
      <EntitiesCommonCardsSorter
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :options="movieSortOptions"
        :search-query="searchQuery"
        search-placeholder="Найти фильм..."
        @update-sorting="handleSortUpdate"
        @update:search-query="handleSearchUpdate"
      />
    </div>
    <TransitionGroup name="cards-list" tag="div" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <EntitiesMoviesCard v-for="movie in movies" :key="movie.id" :movie="movie" />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { Movie, SortableMovieFields } from '~/types/api'

const movieSortOptions: { value: SortableMovieFields; label: string }[] = [
  { value: 'title', label: 'По названию' },
  { value: 'genre', label: 'По жанру' },
  { value: 'releaseYear', label: 'По году выхода' },
  { value: 'createdAt', label: 'По дате добавления' },
]

interface Props {
  movies: Movie[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  searchQuery?: string
}

defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
  'update:searchQuery': [value: string]
}>()

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}

const handleSearchUpdate = (value: string) => {
  emit('update:searchQuery', value)
}
</script>
