<template>
  <UiTable
    :items="books"
    :columns="columns"
    :sort-by="sortBy"
    :sort-order="sortOrder"
    @update-sorting="handleSortUpdate"
  >
    <template #cell-title="{ item }">
      <NuxtLink :to="`/books/${item.id}`" class="font-medium text-indigo-700 hover:underline">
        {{ item.title }}
      </NuxtLink>
    </template>

    <template #cell-authors="{ item }">
      <div v-if="item.authors?.length" class="flex flex-wrap gap-x-2 gap-y-1">
        <NuxtLink
          v-for="author in item.authors"
          :key="author.id"
          :to="`/books/authors/${author.id}`"
          class="font-medium text-indigo-700 hover:underline"
        >
          {{ author.fullName }}
        </NuxtLink>
      </div>
      <span v-else>—</span>
    </template>

    <template #cell-genre="{ item }">
      {{ item.genre ?? '—' }}
    </template>

    <template #cell-publishYear="{ item }">
      {{ item.publishYear ?? '—' }}
    </template>

    <template #cell-createdAt="{ item }">
      <UiDateDisplay :date="item.createdAt" />
    </template>

    <template #cell-actions="{ item }">
      <div class="flex justify-end gap-2">
        <NuxtLink
          :to="`/books/${item.id}/edit`"
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
import type { Book } from '~/types/api'

interface Props {
  books: Book[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const columns: TableColumn[] = [
  { key: 'title', label: 'Название', sortable: true },
  { key: 'authors', label: 'Авторы' },
  { key: 'genre', label: 'Жанр', sortable: true },
  { key: 'publishYear', label: 'Год издания', sortable: true },
  { key: 'createdAt', label: 'Добавлена', sortable: true },
  { key: 'actions', label: 'Действия', align: 'right' as const },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
