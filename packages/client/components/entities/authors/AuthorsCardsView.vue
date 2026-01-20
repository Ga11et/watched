<template>
  <div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AuthorCard
        v-for="author in sortedAuthors"
        :key="author.id"
        :author="author"
        @delete="$emit('deleted', $event)"
      />
    </div>
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
</script>
