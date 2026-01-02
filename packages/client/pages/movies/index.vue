<template>
  <div class="mx-auto max-w-7xl">
    <Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Фильмы' }]" />

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
      <MoviesCardsView
        v-if="viewMode === 'cards' && movies?.length"
        :movies="movies"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
      <MoviesTableView
        v-else-if="movies?.length"
        :movies="movies"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
    </Transition>
  </div>
</template>

<script setup>
const error = ref('')
const movies = ref([])

const viewMode = useCookie('watched_movies_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortBy = useCookie('watched_movies_sort_by', {
  default: () => 'watchDate',
  sameSite: 'lax',
})

const sortOrder = useCookie('watched_movies_sort_order', {
  default: () => 'DESC',
  sameSite: 'lax',
})

const updateSorting = (newSortBy) => {
  if (sortBy.value === newSortBy) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = newSortBy
    sortOrder.value = 'ASC'
  }
}

// TODO: Implement API calls to fetch movies and directors
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
