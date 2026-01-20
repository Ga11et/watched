<template>
  <div>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <BookCard
        v-for="book in sortedBooks"
        :key="book.id"
        :book="book"
        @delete="$emit('deleted', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Author {
  id: string
  name: string
}

interface Book {
  id: string
  title: string
  description?: string
  publishedYear?: number
  genre?: string
  pages?: number
  cover?: string
  author?: Author
  createdAt: string
}

interface Props {
  books: Book[]
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
}

const props = defineProps<Props>()

defineEmits<{
  deleted: [id: string]
  'update-sorting': [sortBy: string]
}>()

const sortedBooks = computed(() => {
  const booksList = props.books || []

  // Сортировка
  return [...booksList].sort((a, b) => {
    const aValue = a[props.sortBy as keyof Book]
    const bValue = b[props.sortBy as keyof Book]

    if (aValue === undefined || aValue === null) return 1
    if (bValue === undefined || bValue === null) return -1

    let comparison = 0
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue)
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    } else {
      comparison = String(aValue).localeCompare(String(bValue))
    }

    return props.sortOrder === 'ASC' ? comparison : -comparison
  })
})
</script>
