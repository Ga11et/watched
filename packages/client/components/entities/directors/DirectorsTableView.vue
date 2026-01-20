<template>
  <Table
    :items="directors"
    :columns="columns"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    @update-sorting="updateSort"
  >
    <template #cell-fullName="{ item }">
      <NuxtLink
        :to="`/movies/directors/${item.id}`"
        class="font-medium text-indigo-700 hover:underline"
      >
        {{ item.fullName }}
      </NuxtLink>
    </template>
    <template #cell-createdAt="{ item }">
      <DateDisplay :date="item.createdAt" />
    </template>
    <template #cell-actions="{ item }">
      <div class="flex justify-end gap-2">
        <NuxtLink
          :to="`/movies/directors/${item.id}/edit`"
          class="inline-flex items-center rounded border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Редактировать
        </NuxtLink>
      </div>
    </template>
  </Table>
</template>

<script setup lang="ts">
interface Director {
  id: string
  fullName: string
  comment?: string | null
  createdAt?: string | null
}

interface Props {
  directors: Director[]
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
}

defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const columns = [
  { key: 'fullName', label: 'ФИО', sortable: true },
  { key: 'createdAt', label: 'Дата добавления', sortable: true },
  { key: 'actions', label: 'Действия', align: 'right' as const },
]

const updateSort = (value: string) => {
  emit('update-sorting', value)
}
</script>
