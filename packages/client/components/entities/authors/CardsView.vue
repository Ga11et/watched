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
      <EntitiesAuthorsCard
        v-for="author in authors"
        :key="author.id"
        :author="author"
        @delete="$emit('deleted', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Author } from '~/types/api'

interface Props {
  authors: Author[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  deleted: [id: string]
  'update-sorting': [sortBy: string]
}>()

const sortOptions = [
  { value: 'name', label: 'По имени' },
  { value: 'birthYear', label: 'По году рождения' },
  { value: 'country', label: 'По стране' },
  { value: 'createdAt', label: 'По дате добавления' },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
