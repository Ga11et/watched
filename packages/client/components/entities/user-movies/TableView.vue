<template>
  <UiTable
    :items="movies"
    :columns="columns"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    @update-sorting="$emit('update-sorting', $event)"
  >
    <template #cell-title="{ item }">
      <NuxtLink :to="`/user-movies/${item.id}`" class="font-medium text-indigo-700 hover:underline">
        {{ item.movie.title }}
      </NuxtLink>
    </template>

    <template #cell-directors="{ item }">
      <div v-if="item.movie.directors?.length" class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="director in item.movie.directors"
          :key="director.id"
          :to="`/movies/directors/${director.id}`"
          class="text-indigo-700 hover:underline"
        >
          {{ director.fullName }}
        </NuxtLink>
      </div>
      <span v-else>—</span>
    </template>

    <template #cell-genre="{ item }">
      {{ item.movie.genre ?? '—' }}
    </template>

    <template #cell-releaseYear="{ item }">
      {{ item.movie.releaseYear ?? '—' }}
    </template>

    <template #cell-rating="{ item }">
      {{ item.rating != null ? `${item.rating}/100` : '—' }}
    </template>

    <template #cell-watchedAt="{ item }">
      <UiDateDisplay :date="item.watchedAt" />
    </template>

    <template #cell-createdAt="{ item }">
      <UiDateDisplay :date="item.createdAt" />
    </template>

    <template #cell-actions="{ item }">
      <div class="flex justify-end gap-2">
        <NuxtLink :to="`/user-movies/${item.id}/edit`" class="text-indigo-700 hover:underline">
          Редактировать
        </NuxtLink>
      </div>
    </template>
  </UiTable>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/components/ui/Table.vue'
import type { UserMovie } from '~/types/api'

defineProps<{
  movies: UserMovie[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}>()

defineEmits<{ 'update-sorting': [sortBy: string] }>()

const columns: TableColumn[] = [
  { key: 'title', sortKey: 'movie.title', label: 'Название', sortable: true },
  { key: 'directors', label: 'Режиссёры' },
  { key: 'genre', label: 'Жанр' },
  { key: 'releaseYear', label: 'Год выхода' },
  { key: 'rating', label: 'Оценка', sortable: true },
  { key: 'watchedAt', label: 'Дата просмотра', sortable: true },
  { key: 'createdAt', label: 'Добавлен', sortable: true },
  { key: 'actions', label: 'Действия', align: 'right' as const },
]
</script>
