<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Сериалы' }]" />

    <div
      v-if="error"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Сериалы</h2>
      <div class="flex items-center gap-3">
        <div class="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm transition"
            :class="
              viewMode === 'cards'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            "
            @click="viewMode = 'cards'"
          >
            Карточки
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1.5 text-sm transition"
            :class="
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            "
            @click="viewMode = 'table'"
          >
            Таблица
          </button>
        </div>
        <NuxtLink
          to="/series/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Добавить сериал
        </NuxtLink>
      </div>
    </div>

    <div v-if="!series?.length" class="text-center py-12 text-gray-500">
      Сериалов пока нет. Добавьте свой первый сериал!
    </div>

    <Transition name="fade" mode="out-in">
      <EntitiesSeriesCardsView
        v-if="viewMode === 'cards'"
        :series="filteredSeries"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :search-query="searchQuery"
        @update-sorting="updateSorting"
        @update:searchQuery="updateSearchQuery"
      />
      <EntitiesSeriesTableView
        v-else
        :series="filteredSeries"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
    </Transition>
  </div>
</template>

<script setup>
const error = ref('')
const config = useRuntimeConfig()

const viewMode = useCookie('watched_series_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortBy = useCookie('watched_series_sort_by', {
  default: () => 'watchedAt',
  sameSite: 'lax',
})

const sortOrder = useCookie('watched_series_sort_order', {
  default: () => 'DESC',
  sameSite: 'lax',
})

const searchQuery = ref('')

const updateSorting = (newSortBy) => {
  if (sortBy.value === newSortBy) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = newSortBy
    sortOrder.value = 'ASC'
  }
}

const { data: series } = await useAsyncData(
  'series',
  async () => {
    try {
      error.value = ''
      return await $fetch(`${config.public.apiBase}/series`, {
        params: {
          sortBy: sortBy.value,
          sortOrder: sortOrder.value,
        },
      })
    } catch {
      error.value = 'Не удалось загрузить сериалы'
      return []
    }
  },
  {
    watch: [sortBy, sortOrder],
  },
)

const filteredSeries = computed(() => {
  const list = series.value || []
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return list
  }

  return list.filter((item) => (item.title || '').toLowerCase().includes(query))
})

const updateSearchQuery = (value) => {
  searchQuery.value = value
}
</script>
