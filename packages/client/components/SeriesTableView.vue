<template>
  <Table
    :items="series"
    :columns="columns"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    @update-sorting="handleSortUpdate"
  >
    <template #cell-title="{ item }">
      <NuxtLink :to="`/series/${item.id}`" class="font-medium text-indigo-700 hover:underline">
        {{ item.title }}
      </NuxtLink>
    </template>

    <template #cell-genres="{ item }">
      {{ item.genres || '—' }}
    </template>

    <template #cell-country="{ item }">
      {{ item.country ?? '—' }}
    </template>

    <template #cell-rating="{ item }">
      {{ item.rating != null ? `${Math.round(item.rating)}/100` : '—' }}
    </template>

    <template #cell-seasons="{ item }">
      <div v-if="item.totalSeasons" class="flex items-center gap-2">
        <span>{{ item.watchedSeasons || 0 }}/{{ item.totalSeasons }}</span>
        <div
          v-if="item.totalSeasons && item.watchedSeasons"
          class="w-12 bg-gray-200 rounded-full h-1.5"
        >
          <div
            class="bg-indigo-600 h-1.5 rounded-full"
            :style="{ width: `${Math.round((item.watchedSeasons / item.totalSeasons) * 100)}%` }"
          ></div>
        </div>
      </div>
      <span v-else>—</span>
    </template>

    <template #cell-watchedAt="{ item }">
      <DateDisplay :date="item.watchedAt" />
    </template>

    <template #cell-actions="{ item }">
      <div class="flex justify-end gap-2">
        <NuxtLink
          :to="`/series/${item.id}/edit`"
          class="inline-flex items-center rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Редактировать
        </NuxtLink>
      </div>
    </template>
  </Table>
</template>

<script setup lang="ts">
interface Series {
  id: string
  title: string
  genres?: string | null
  country?: string | null
  poster?: string | null
  watchedAt?: string | null
  comment?: string | null
  rating?: number | null
  totalSeasons?: number | null
  watchedSeasons?: number | null
  createdAt?: string | null
}

interface Props {
  series: Series[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const columns = [
  { key: 'title', label: 'Название', sortable: true },
  { key: 'genres', label: 'Жанры', sortable: false },
  { key: 'country', label: 'Страна', sortable: true },
  { key: 'rating', label: 'Рейтинг', sortable: true },
  { key: 'seasons', label: 'Сезоны', sortable: true },
  { key: 'watchedAt', label: 'Дата просмотра', sortable: true },
  { key: 'actions', label: 'Действия', align: 'right' as const },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
