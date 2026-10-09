<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Фильмы', to: '/movies' },
        { label: 'Режиссёры' },
      ]"
    />

    <div
      v-if="error"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Режиссёры</h2>
      <div class="flex items-center gap-3">
        <UiViewToggle v-model="viewMode" />
        <NuxtLink
          to="/movies/directors/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Добавить режиссёра
        </NuxtLink>
      </div>
    </div>

    <UiEmpty
      v-if="!directors?.length"
      message="Режиссёров пока нет. Добавьте своего первого режиссёра!"
    />

    <Transition name="fade" mode="out-in">
      <EntitiesDirectorsCardsView
        v-if="viewMode === 'cards'"
        :directors="filteredDirectors"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :search-query="searchQuery"
        @update-sorting="updateSorting"
        @update:search-query="updateSearchQuery"
      />
      <EntitiesDirectorsTableView
        v-else
        :directors="filteredDirectors"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Director } from '~/types/api'

const directorsApi = useDirectors()
const error = ref<string>('')

const viewMode = useCookie<'cards' | 'table'>('watched_directors_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortBy = useCookie<string>('watched_directors_sort_by', {
  default: () => 'fullName',
  sameSite: 'lax',
})

const sortOrder = useCookie<'ASC' | 'DESC'>('watched_directors_sort_order', {
  default: () => 'ASC',
  sameSite: 'lax',
})

const searchQuery = ref('')

const updateSorting = (newSortBy: string): void => {
  if (sortBy.value === newSortBy) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = newSortBy
    sortOrder.value = 'ASC'
  }
}

const { data: directors } = await useAsyncData<Director[]>(
  'directors',
  async () => {
    try {
      error.value = ''
      return await directorsApi.list({
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
      })
    } catch {
      error.value = 'Не удалось загрузить режиссёров'
      return []
    }
  },
  {
    watch: [sortBy, sortOrder],
  },
)

const filteredDirectors = computed(() => {
  const list = directors.value || []
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return list
  }

  return list.filter((director) => (director.fullName || '').toLowerCase().includes(query))
})

const updateSearchQuery = (value: string): void => {
  searchQuery.value = value
}
</script>
