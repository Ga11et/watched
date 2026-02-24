<template>
  <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
      <div>
        <label for="cards-sorter-search" class="mb-1 block text-sm font-medium text-gray-700">
          Поиск
        </label>
        <div class="relative">
          <input
            id="cards-sorter-search"
            v-model="currentSearchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="block h-[38px] w-full rounded-md border border-gray-300 px-3 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button
            v-if="currentSearchQuery"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Очистить поиск"
            @click="clearSearch"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <div>
        <label for="cards-sorter-sort-by" class="mb-1 block text-sm font-medium text-gray-700">
          Сортировать по
        </label>
        <UiSelect
          id="cards-sorter-sort-by"
          v-model="currentSortBy"
          :options="options"
          placeholder="Выберите поле"
          class="min-w-48"
        />
      </div>

      <button
        type="button"
        :disabled="!currentSortBy"
        class="inline-flex h-[38px] items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        :title="sortOrder === 'ASC' ? 'Переключить на убывание' : 'Переключить на возрастание'"
        @click="toggleSortOrder"
      >
        <svg
          class="mr-2 h-4 w-4 transition-transform duration-200"
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
        {{ sortOrder === 'ASC' ? 'По возрастанию' : 'По убыванию' }}
      </button>
    </div>
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
  searchQuery?: string
  searchPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  sortBy: '',
  sortOrder: 'ASC',
  searchQuery: '',
  searchPlaceholder: 'Найти...',
})

const emit = defineEmits<{
  'update-sorting': [sortBy: string]
  'update:searchQuery': [value: string]
}>()

const currentSortBy = computed({
  get: () => props.sortBy,
  set: (value: string) => {
    if (value) {
      emit('update-sorting', value)
    }
  },
})

const currentSearchQuery = computed({
  get: () => props.searchQuery,
  set: (value: string) => {
    emit('update:searchQuery', value)
  },
})

const toggleSortOrder = () => {
  if (!props.sortBy) return
  emit('update-sorting', props.sortBy)
}

const clearSearch = () => {
  emit('update:searchQuery', '')
}
</script>
