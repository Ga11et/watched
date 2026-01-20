<template>
  <div>
    <Table :headers="headers" :items="tableItems" @edit="handleEdit" @delete="handleDelete" />
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

const router = useRouter()

const headers = [
  { key: 'title', label: 'Название' },
  { key: 'author', label: 'Автор' },
  { key: 'genre', label: 'Жанр' },
  { key: 'publishedYear', label: 'Год' },
  { key: 'pages', label: 'Страниц' },
  { key: 'createdAt', label: 'Добавлена' },
  { key: 'actions', label: 'Действия' },
]

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

const tableItems = computed(() => {
  return sortedBooks.value.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author?.name || '-',
    genre: book.genre || '-',
    publishedYear: book.publishedYear || '-',
    pages: book.pages || '-',
    createdAt: book.createdAt,
    actions: {
      view: `/books/${book.id}`,
      edit: `/books/${book.id}/edit`,
    },
  }))
})

const handleEdit = (id: string) => {
  router.push(`/books/${id}/edit`)
}

const handleDelete = (id: string) => {
  emit('deleted', id)
}
</script>
