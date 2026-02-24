<template>
  <div>
    <div class="mb-6">
      <EntitiesCommonCardsSorter
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :options="sortOptions"
        :search-query="searchQuery"
        search-placeholder="Найти разработчика..."
        @update-sorting="handleSortUpdate"
        @update:searchQuery="handleSearchUpdate"
      />
    </div>
    <TransitionGroup name="cards-list" tag="div" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <EntitiesDevelopersCard
        v-for="developer in developers"
        :key="developer.id"
        :developer="developer"
        @delete="$emit('deleted', $event)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { Developer } from '~/types/api'

interface Props {
  developers: Developer[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  searchQuery?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  deleted: [id: string]
  'update-sorting': [sortBy: string]
  'update:searchQuery': [value: string]
}>()

const sortOptions = [
  { value: 'fullName', label: 'По имени' },
  { value: 'createdAt', label: 'По дате добавления' },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}

const handleSearchUpdate = (value: string) => {
  emit('update:searchQuery', value)
}
</script>
