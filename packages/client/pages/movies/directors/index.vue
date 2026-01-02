<template>
  <div class="mx-auto max-w-7xl">
    <Breadcrumbs
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
          to="/movies/directors/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Добавить режиссёра
        </NuxtLink>
      </div>
    </div>

    <div v-if="!directors?.length" class="text-center py-12 text-gray-500">
      Режиссёров пока нет. Добавьте первого режиссёра!
    </div>

    <Transition name="fade" mode="out-in">
      <DirectorsCardsView
        v-if="directors?.length && viewMode === 'cards'"
        :directors="directors"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
      <DirectorsTableView
        v-else-if="directors?.length"
        :directors="directors"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
    </Transition>
  </div>
</template>

<script setup>
const error = ref('')
const directors = ref([])

const viewMode = useCookie('watched_directors_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortBy = useCookie('watched_directors_sort_by', {
  default: () => 'fullName',
  sameSite: 'lax',
})

const sortOrder = useCookie('watched_directors_sort_order', {
  default: () => 'ASC',
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

// TODO: Implement API call to fetch directors
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
