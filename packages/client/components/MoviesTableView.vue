<template>
  <div class="movies-table">
    <Table
      :items="movies"
      :columns="columns"
      :sort-by="sortBy"
      :sort-desc="sortDesc"
      @update:sort-by="updateSort"
      @update:sort-desc="updateSortDesc"
    >
      <template #cell-director="{ item }">
        {{ item.director.fullName }}
      </template>
      <template #cell-watchDate="{ item }">
        {{ formatDate(item.watchDate) }}
      </template>
      <template #cell-rating="{ item }"> {{ item.rating }}/100 </template>
    </Table>
  </div>
</template>
<script setup>
defineProps({
  movies: {
    type: Array,
    required: true,
  },
})

const sortBy = ref('watchDate')
const sortDesc = ref(true)

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'director', label: 'Director' },
  { key: 'watchDate', label: 'Watch Date' },
  { key: 'rating', label: 'Rating' },
  { key: 'comment', label: 'Comment' },
]

const updateSort = (value) => {
  sortBy.value = value
}

const updateSortDesc = (value) => {
  sortDesc.value = value
}
</script>
