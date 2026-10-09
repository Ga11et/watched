<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Фильмы' }]" />

    <div
      v-if="error"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Фильмы</h2>
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
          to="/movies/directors"
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Режиссёры
        </NuxtLink>
        <NuxtLink
          to="/movies/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Добавить фильм
        </NuxtLink>
      </div>
    </div>

    <div v-if="!movies?.length" class="text-center py-12 text-gray-500">
      Фильмов пока нет. Добавьте свой первый фильм!
    </div>

    <Transition name="fade" mode="out-in">
      <EntitiesMoviesCardsView
        v-if="viewMode === 'cards'"
        :movies="filteredMovies"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :search-query="searchQuery"
        @update-sorting="updateSorting"
        @update:search-query="updateSearchQuery"
      />
      <EntitiesMoviesTableView
        v-else
        :movies="filteredMovies"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Movie, SortableMovieFields } from '~/types/api'

const sortFields: SortableMovieFields[] = ['title', 'genre', 'releaseYear', 'createdAt']

const error = ref<string>('')
const moviesApi = useMovies()

const viewMode = useCookie<'cards' | 'table'>('watched_movies_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortBy = useCookie<string>('watched_movies_sort_by', {
  default: () => 'createdAt',
  sameSite: 'lax',
})

const sortOrder = useCookie<'ASC' | 'DESC'>('watched_movies_sort_order', {
  default: () => 'DESC',
  sameSite: 'lax',
})

watch(
  [sortBy, sortOrder],
  () => {
    if (!sortFields.some((field) => field === sortBy.value)) {
      sortBy.value = 'createdAt'
      sortOrder.value = 'DESC'
    } else if (sortOrder.value !== 'ASC' && sortOrder.value !== 'DESC') {
      sortOrder.value = 'DESC'
    }
  },
  { immediate: true, flush: 'sync' },
)

const searchQuery = ref('')

const updateSorting = (newSortBy: string): void => {
  if (!sortFields.some((field) => field === newSortBy)) return
  if (sortBy.value === newSortBy) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = newSortBy
    sortOrder.value = 'ASC'
  }
}

const { data: movies } = await useAsyncData<Movie[]>(
  'movies',
  async () => {
    try {
      error.value = ''
      return await moviesApi.list({
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
      })
    } catch {
      error.value = 'Не удалось загрузить фильмы'
      return []
    }
  },
  {
    watch: [sortBy, sortOrder],
  },
)

const filteredMovies = computed(() => {
  const list = movies.value || []
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return list
  }

  return list.filter((movie) => {
    return (movie.title || '').toLowerCase().includes(query)
  })
})

const updateSearchQuery = (value: string): void => {
  searchQuery.value = value
}
</script>
