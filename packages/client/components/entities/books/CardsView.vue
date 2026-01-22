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
      <EntitiesBooksCard
        v-for="book in books"
        :key="book.id"
        :book="book"
        @delete="$emit('deleted', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Book } from '~/types/api'

interface Props {
  books: Book[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  deleted: [id: string]
  'update-sorting': [sortBy: string]
}>()

const sortOptions = [
  { value: 'title', label: 'По названию' },
  { value: 'author.fullName', label: 'По автору' },
  { value: 'genre', label: 'По жанру' },
  { value: 'publishedYear', label: 'По году издания' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'readAt', label: 'По дате прочтения' },
  { value: 'createdAt', label: 'По дате добавления' },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
