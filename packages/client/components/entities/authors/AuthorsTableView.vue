<template>
  <div>
    <Table :headers="headers" :items="tableItems" @edit="handleEdit" @delete="handleDelete" />
  </div>
</template>

<script setup lang="ts">
interface Author {
  id: string
  name: string
  birthYear?: number
  deathYear?: number
  country?: string
  photo?: string
  createdAt: string
}

interface Props {
  authors: Author[]
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
  { key: 'name', label: 'Имя' },
  { key: 'birthYear', label: 'Годы жизни' },
  { key: 'country', label: 'Страна' },
  { key: 'createdAt', label: 'Добавлен' },
  { key: 'actions', label: 'Действия' },
]

const sortedAuthors = computed(() => {
  const authorsList = props.authors || []

  // Сортировка
  return [...authorsList].sort((a, b) => {
    const aValue = a[props.sortBy as keyof Author]
    const bValue = b[props.sortBy as keyof Author]

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
  return sortedAuthors.value.map((author) => ({
    id: author.id,
    name: author.name,
    birthYear: author.birthYear
      ? `${author.birthYear}${author.deathYear ? ` - ${author.deathYear}` : ''}`
      : '-',
    country: author.country || '-',
    createdAt: author.createdAt,
    actions: {
      view: `/books/authors/${author.id}`,
      edit: `/books/authors/${author.id}/edit`,
    },
  }))
})

const handleEdit = (id: string) => {
  router.push(`/books/authors/${id}/edit`)
}

const handleDelete = (id: string) => {
  emit('deleted', id)
}
</script>
