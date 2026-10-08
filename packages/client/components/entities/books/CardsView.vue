<template>
  <div>
    <div class="mb-6">
      <EntitiesCommonCardsSorter
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :options="sortOptions"
        :search-query="searchQuery"
        search-placeholder="Найти книгу..."
        @update-sorting="handleSortUpdate"
        @update:searchQuery="handleSearchUpdate"
      />
    </div>
    <TransitionGroup name="cards-list" tag="div" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <EntitiesBooksCard
        v-for="book in books"
        :key="book.id"
        :book="book"
        @delete="$emit('deleted', $event)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { Book } from '~/types/api'

interface Props {
  books: Book[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  searchQuery?: string
}

defineProps<Props>()

const emit = defineEmits<{
  deleted: [id: string]
  'update-sorting': [sortBy: string]
  'update:searchQuery': [value: string]
}>()

const sortOptions = [
  { value: 'title', label: 'По названию' },
  { value: 'genre', label: 'По жанру' },
  { value: 'publishYear', label: 'По году издания' },
  { value: 'createdAt', label: 'По дате добавления' },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}

const handleSearchUpdate = (value: string) => {
  emit('update:searchQuery', value)
}
</script>
