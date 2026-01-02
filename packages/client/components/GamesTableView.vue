<template>
  <Table
    :columns="columns"
    :items="games"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    @update-sorting="handleSort"
  >
    <template #cell-title="{ item }">
      <NuxtLink :to="`/games/${item.id}`" class="font-medium text-indigo-700 hover:underline">
        {{ item.title }}
      </NuxtLink>
    </template>

    <template #cell-completionDate="{ item }">
      <DateDisplay :date="item.completionDate" />
    </template>

    <template #cell-playTimeHours="{ item }">
      {{ item.playTimeHours ?? '—' }}
    </template>

    <template #cell-rating="{ item }">
      {{ item.rating ?? '—' }}
    </template>

    <template #cell-actions="{ item }">
      <div class="flex justify-end gap-2">
        <NuxtLink
          :to="`/games/${item.id}/edit`"
          class="inline-flex items-center rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Редактировать
        </NuxtLink>
      </div>
    </template>
  </Table>
</template>

<script setup lang="ts">
import Table from './Table.vue'
import DateDisplay from './DateDisplay.vue'

interface Game {
  id: string
  title: string
  completionDate?: string | null
  playTimeHours?: number | null
  comment?: string | null
  rating?: number | null
}

interface Props {
  games: Game[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const columns = [
  { key: 'title', label: 'Название', sortable: true },
  { key: 'completionDate', label: 'Дата прохождения', sortable: true },
  { key: 'playTimeHours', label: 'Время (ч)', sortable: true },
  { key: 'rating', label: 'Оценка', sortable: true },
  { key: 'actions', label: 'Действия', align: 'right' as const },
]

const handleSort = (field: string) => {
  emit('update-sorting', field)
}
</script>
