<template>
  <div>
    <div class="mb-6">
      <SortControl :sort-by="sortBy" :sort-order="sortOrder" @update-sorting="handleSortUpdate" />
    </div>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <GameCard v-for="game in games" :key="game.id" :game="game" />
    </div>
  </div>
</template>

<script setup lang="ts">
import GameCard from './GameCard.vue'
import SortControl from './SortControl.vue'

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

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
