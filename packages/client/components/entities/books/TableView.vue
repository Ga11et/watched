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

    <template #cell-author.fullName="{ item }">
      <NuxtLink
        v-if="item.author"
        :to="`/books/authors/${item.author.id}`"
        class="font-medium text-indigo-700 hover:underline"
      >
        {{ item.author.fullName }}
      </NuxtLink>
      <span v-else>—</span>
    </template>

    <template #cell-genre="{ item }">
      {{ item.genre ?? '—' }}
    </template>

    <template #cell-publishedYear="{ item }">
      {{ item.publishedYear ?? '—' }}
    </template>

    <template #cell-rating="{ item }">
      {{ item.rating != null ? `${item.rating}/10` : '—' }}
    </template>

    <template #cell-readAt="{ item }">
      <UiDateDisplay :date="item.readAt" />
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
import type { Book } from '~/types/api'

interface Props {
  books: Book[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const columns = [
  { key: 'title', label: 'Название', sortable: true },
  { key: 'author.fullName', label: 'Автор', sortable: true },
  { key: 'genre', label: 'Жанр', sortable: true },
  { key: 'publishedYear', label: 'Год издания' },
  { key: 'rating', label: 'Рейтинг', sortable: true },
  { key: 'readAt', label: 'Дата прочтения', sortable: true },
  { key: 'createdAt', label: 'Добавлена', sortable: true },
  { key: 'actions', label: 'Действия', align: 'right' as const },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
