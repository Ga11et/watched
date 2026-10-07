<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Ваши фильмы' }]" />

    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-bold">Ваши фильмы</h1>
      <div class="flex items-center gap-3">
        <UiViewToggle v-model="viewMode" />
        <NuxtLink
          to="/user-movies/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Добавить фильм
        </NuxtLink>
      </div>
    </div>

    <div class="mb-6">
      <EntitiesCommonCardsSorter
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :options="sortOptions"
        :search-query="searchQuery"
        search-placeholder="Найти фильм..."
        @update-sorting="updateSorting"
        @update:searchQuery="searchQuery = $event"
      />
    </div>

    <div v-if="pending" role="status" class="py-8 text-center text-gray-500">Загрузка...</div>
    <div
      v-else-if="error"
      role="alert"
      class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      Не удалось загрузить фильмы.
      <button type="button" class="underline" @click="refresh()">Попробовать снова</button>
    </div>
    <UiEmpty v-else-if="!movies?.length" message="Фильмов в вашем списке пока нет." />
    <UiEmpty v-else-if="!visibleMovies.length" message="По вашему запросу фильмы не найдены." />
    <EntitiesUserMoviesCardsView v-else-if="viewMode === 'cards'" :movies="visibleMovies" />
    <EntitiesUserMoviesTableView
      v-else
      :movies="visibleMovies"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      @update-sorting="updateSorting"
    />
  </div>
</template>

<script setup lang="ts">
import type { UserMovie } from '~/types/api'

const sortOptions = [
  { value: 'movie.title', label: 'По названию' },
  { value: 'rating', label: 'По оценке' },
  { value: 'watchedAt', label: 'По дате просмотра' },
  { value: 'createdAt', label: 'По дате добавления' },
]

const cookieOptions = { sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 365 }
const viewMode = useCookie<'cards' | 'table'>('watched_user_movies_view_mode', {
  ...cookieOptions,
  default: () => 'cards',
})
const sortBy = useCookie<string>('watched_user_movies_sort_by', {
  ...cookieOptions,
  default: () => 'createdAt',
})
const sortOrder = useCookie<'ASC' | 'DESC'>('watched_user_movies_sort_order', {
  ...cookieOptions,
  default: () => 'DESC',
})
const searchQuery = ref('')

watchEffect(() => {
  if (viewMode.value !== 'cards' && viewMode.value !== 'table') viewMode.value = 'cards'
  if (!sortOptions.some((option) => option.value === sortBy.value)) sortBy.value = 'createdAt'
  if (sortOrder.value !== 'ASC' && sortOrder.value !== 'DESC') sortOrder.value = 'DESC'
})

const updateSorting = (field: string) => {
  if (!sortOptions.some((option) => option.value === field)) return
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = field
    sortOrder.value = 'ASC'
  }
}

const { list } = useUserMovies()
const {
  data: movies,
  pending,
  error,
  refresh,
} = useLazyAsyncData('user-movies', list, {
  server: false,
})

const sortValue = (record: UserMovie): number | null => {
  if (sortBy.value === 'rating') return record.rating ?? null
  const date = sortBy.value === 'watchedAt' ? record.watchedAt : record.createdAt
  const value = date ? Date.parse(date) : NaN
  return Number.isFinite(value) ? value : null
}

const visibleMovies = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('ru')
  return (movies.value ?? [])
    .filter((record) => record.movie.title.toLocaleLowerCase('ru').includes(query))
    .sort((left, right) => {
      const direction = sortOrder.value === 'ASC' ? 1 : -1
      if (sortBy.value === 'movie.title') {
        return direction * left.movie.title.localeCompare(right.movie.title, 'ru')
      }
      const a = sortValue(left)
      const b = sortValue(right)
      if (a == null) return b == null ? 0 : 1
      if (b == null) return -1
      return direction * (a - b)
    })
})
</script>
