<template>
  <div>
    <div class="mb-6">
      <EntitiesCommonCardsSorter
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :options="sortOptions"
        :search-query="searchQuery"
        search-placeholder="Найти сериал..."
        @update-sorting="handleSortUpdate"
        @update:searchQuery="handleSearchUpdate"
      />
    </div>
    <TransitionGroup name="cards-list" tag="div" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <EntitiesSeriesCard v-for="item in series" :key="item.id" :series="item" />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
interface Series {
  id: string
  title: string
  genres?: string | null
  country?: string | null
  poster?: string | null
  watchedAt?: string | null
  comment?: string | null
  rating?: number | null
  totalSeasons?: number | null
  watchedSeasons?: number | null
  createdAt?: string | null
}

interface Props {
  series: Series[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  searchQuery?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
  'update:searchQuery': [value: string]
}>()

const sortOptions = [
  { value: 'title', label: 'По названию' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'country', label: 'По стране' },
  { value: 'watchedAt', label: 'По дате просмотра' },
  { value: 'createdAt', label: 'По дате добавления' },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}

const handleSearchUpdate = (value: string) => {
  emit('update:searchQuery', value)
}
</script>
