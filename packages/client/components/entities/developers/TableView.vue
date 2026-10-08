<template>
  <UiTable
    :items="developers"
    :columns="columns"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    @update-sorting="handleSortUpdate"
  >
    <template #cell-fullName="{ item }">
      <NuxtLink
        :to="`/games/developers/${item.id}`"
        class="font-medium text-indigo-700 hover:underline"
      >
        {{ item.fullName }}
      </NuxtLink>
    </template>

    <template #cell-createdAt="{ item }">
      <UiDateDisplay :date="item.createdAt" />
    </template>

    <template #cell-actions="{ item }">
      <div class="flex justify-end gap-2">
        <NuxtLink
          :to="`/games/developers/${item.id}/edit`"
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
import type { Developer } from '~/types/api'

interface Props {
  developers: Developer[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const columns: TableColumn[] = [
  { key: 'fullName', label: 'Имя', sortable: true },
  { key: 'createdAt', label: 'Добавлен', sortable: true },
  { key: 'actions', label: 'Действия', align: 'right' as const },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
