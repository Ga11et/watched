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
      <EntitiesUserBooksCard v-for="userBook in books" :key="userBook.id" :user-book="userBook" />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { UserBook } from '~/types/api'

interface Props {
  books: UserBook[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  searchQuery?: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update-sorting': [sortBy: string]
  'update:searchQuery': [value: string]
}>()

const sortOptions = [
  { value: 'book.title', label: 'По названию' },
  { value: 'book.author.fullName', label: 'По автору' },
  { value: 'book.genre', label: 'По жанру' },
  { value: 'book.publishYear', label: 'По году издания' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'readAt', label: 'По дате прочтения' },
  { value: 'createdAt', label: 'По дате добавления' },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}

const handleSearchUpdate = (value: string) => {
  emit('update:searchQuery', value)
}
</script>
