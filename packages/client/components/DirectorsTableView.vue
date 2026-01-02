<template>
  <Table
    :items="directors"
    :columns="columns"
    :sort-by="sortBy"
    :sort-desc="sortDesc"
    @update:sort-by="updateSort"
    @update:sort-desc="updateSortDesc"
  >
    <template #cell-actions="{ item }">
      <NuxtLink
        :to="`/movies/directors/${item.id}`"
        class="text-sm text-indigo-600 hover:text-indigo-800"
      >
        Смотреть фильмы
      </NuxtLink>
    </template>
  </Table>
</template>

<script setup lang="ts">
import Table from './Table.vue'

interface Director {
  id: string
  fullName: string
  comment?: string | null
}

interface Props {
  directors: Director[]
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const sortDesc = computed(() => props.sortOrder === 'DESC')

const columns = [
  { key: 'fullName', label: 'ФИО' },
  { key: 'comment', label: 'Комментарий' },
  { key: 'actions', label: '' },
]

const updateSort = (value: string) => {
  emit('update-sorting', value)
}

const updateSortDesc = (value: boolean) => {
  emit('update-sorting', props.sortBy)
}
</script>
