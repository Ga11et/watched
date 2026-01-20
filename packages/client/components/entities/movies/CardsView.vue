<template>
  <div>
    <div class="mb-6">
      <UiSorter
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :options="sortOptions"
        @update-sorting="handleSortUpdate"
      />
    </div>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <EntitiesMoviesCard v-for="movie in movies" :key="movie.id" :movie="movie" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Movie {
  id: string
  title: string
  genre?: string | null
  poster?: string | null
  watchedAt?: string | null
  comment?: string | null
  rating?: number | null
  releaseYear?: number | null
  directorId?: string | null
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

const sortOptions = [
  { value: 'title', label: 'По названию' },
  { value: 'genre', label: 'По жанру' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'watchedAt', label: 'По дате просмотра' },
  { value: 'releaseYear', label: 'По году выхода' },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
