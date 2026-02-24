<template>
  <div>
    <div class="mb-6">
      <EntitiesCommonCardsSorter
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :options="sortOptions"
        :search-query="searchQuery"
        search-placeholder="Найти игру..."
        @update-sorting="handleSortUpdate"
        @update:searchQuery="handleSearchUpdate"
      />
    </div>
    <TransitionGroup name="cards-list" tag="div" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <EntitiesGamesCard v-for="game in games" :key="game.id" :game="game" />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
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
  searchQuery?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
  'update:searchQuery': [value: string]
}>()

const sortOptions = [
  { value: 'title', label: 'По названию' },
  { value: 'completionDate', label: 'По дате прохождения' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'playTimeHours', label: 'По времени игры' },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}

const handleSearchUpdate = (value: string) => {
  emit('update:searchQuery', value)
}
</script>
