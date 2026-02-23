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
      <EntitiesPublishersCard
        v-for="publisher in publishers"
        :key="publisher.id"
        :publisher="publisher"
        @delete="$emit('deleted', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Publisher } from '~/types/api'

interface Props {
  publishers: Publisher[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  deleted: [id: string]
  'update-sorting': [sortBy: string]
}>()

const sortOptions = [
  { value: 'fullName', label: 'По имени' },
  { value: 'createdAt', label: 'По дате добавления' },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
