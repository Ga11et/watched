<template>
  <div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
    <span class="text-sm font-medium text-gray-700 whitespace-nowrap">Сортировка:</span>

    <UiSelect
      v-model="currentSortBy"
      :options="options"
      placeholder="Выберите поле"
      class="flex-1 min-w-48"
    />

    <button
      v-if="currentSortBy"
      @click="toggleSortOrder"
      class="inline-flex items-center justify-center w-12 h-[38px] rounded-md border border-gray-300 bg-white text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 transition-all"
      :title="sortOrder === 'ASC' ? 'Возрастание' : 'Убывание'"
    >
      <svg
        class="h-5 w-5 transition-transform duration-200"
        :class="{ 'rotate-180': sortOrder === 'DESC' }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="8,9 12,5 16,9"></polyline>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
interface SortOption {
  value: string
  label: string
}

interface Props {
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  options: SortOption[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const currentSortBy = computed({
  get: () => props.sortBy || '',
  set: (value) => {
    if (value) {
      emit('update-sorting', value)
    }
  },
})

const toggleSortOrder = () => {
  if (props.sortBy) {
    emit('update-sorting', props.sortBy)
  }
}
</script>
