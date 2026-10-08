<template>
  <UiTable
    :items="movies"
    :columns="columns"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    @update-sorting="handleSortUpdate"
  >
    <template #cell-title="{ item }">
      <NuxtLink :to="`/movies/${item.id}`" class="font-medium text-indigo-700 hover:underline">
        {{ item.title }}
      </NuxtLink>
    </template>

    <template #cell-directors="{ item }">
      <div v-if="item.directors.length" class="flex flex-wrap gap-x-2 gap-y-1">
        <NuxtLink
          v-for="director in item.directors"
          :key="director.id"
          :to="`/movies/directors/${director.id}`"
          class="font-medium text-indigo-700 hover:underline"
        >
          {{ director.fullName }}
        </NuxtLink>
      </div>
      <span v-else>—</span>
    </template>

    <template #cell-genre="{ item }">
      {{ item.genre ?? '—' }}
    </template>

    <template #cell-releaseYear="{ item }">
      {{ item.releaseYear ?? '—' }}
    </template>

    <template #cell-createdAt="{ item }">
      <UiDateDisplay :date="item.createdAt" />
    </template>

    <template #cell-actions="{ item }">
      <div class="flex justify-end gap-2">
        <NuxtLink
          :to="`/movies/${item.id}/edit`"
          class="inline-flex items-center rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Редактировать
        </NuxtLink>
      </div>
    </template>
  </UiTable>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/components/ui/Table.vue'
import type { Movie } from '~/types/api'

interface Props {
  movies: Movie[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const columns: TableColumn[] = [
  { key: 'title', label: 'Название', sortable: true },
  { key: 'directors', label: 'Режиссёры' },
  { key: 'genre', label: 'Жанр', sortable: true },
  { key: 'releaseYear', label: 'Год выхода', sortable: true },
  { key: 'createdAt', label: 'Добавлен', sortable: true },
  { key: 'actions', label: 'Действия', align: 'right' as const },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
