<template>
  <div>
    <div class="mb-6">
      <EntitiesCommonCardsSorter
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :options="sortOptions"
        :search-query="searchQuery"
        search-placeholder="Найти режиссёра..."
        @update-sorting="handleSortUpdate"
        @update:searchQuery="handleSearchUpdate"
      />
    </div>
    <TransitionGroup name="cards-list" tag="div" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <EntitiesDirectorsCard
        v-for="director in directors"
        :key="director.id"
        :director="director"
      />
    </TransitionGroup>
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
  searchQuery?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
  'update:searchQuery': [value: string]
}>()

const sortOptions = [
  { value: 'fullName', label: 'По ФИО' },
  { value: 'createdAt', label: 'По дате добавления' },
]

const handleSortUpdate = (sortBy: string) => {
  emit('update-sorting', sortBy)
}

const handleSearchUpdate = (value: string) => {
  emit('update:searchQuery', value)
}
</script>
