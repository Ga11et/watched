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

    <template #cell-genre="{ item }">
      {{ item.genre ?? '—' }}
    </template>

    <template #cell-rating="{ item }">
      {{ item.rating != null ? `${item.rating}/100` : '—' }}
    </template>

    <template #cell-watchedAt="{ item }">
      <UiDateDisplay :date="item.watchedAt" />
    </template>

    <template #cell-releaseYear="{ item }">
      {{ item.releaseYear ?? '—' }}
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
interface Movie {
  id: string
  title: string
  genre?: string | null
  poster?: string | null
  watchedAt?: string | null
  comment?: string | null
  rating?: number | null
  releaseYear?: number | null
  directorId?: string | null
}

interface Props {
  movies: Movie[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const columns = [
  { key: 'title', label: 'Название', sortable: true },
  { key: 'genre', label: 'Жанр', sortable: true },
  { key: 'rating', label: 'Рейтинг', sortable: true },
  { key: 'watchedAt', label: 'Дата просмотра', sortable: true },
  { key: 'releaseYear', label: 'Год выхода', sortable: true },
  { key: 'actions', label: 'Действия', align: 'right' as const },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
