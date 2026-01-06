<template>
  <div>
    <div class="mb-6">
      <SortControl
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :options="sortOptions"
        @update-sorting="handleSortUpdate"
      />
    </div>
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <DirectorCard v-for="director in directors" :key="director.id" :director="director" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Director {
  id: string
  fullName: string
  photo?: string | null
  createdAt?: string | null
}

interface Props {
  directors: Director[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const sortOptions = [
  { value: 'fullName', label: 'По ФИО' },
  { value: 'createdAt', label: 'По дате добавления' },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}
</script>
