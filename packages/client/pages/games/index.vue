<template>
  <div>
    <LayoutBreadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Игры' }]" />
    <div
      v-if="error"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Игры</h2>
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
          to="/games/developers"
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Разработчики
        </NuxtLink>
        <NuxtLink
          to="/games/publishers"
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Издатели
        </NuxtLink>
        <NuxtLink
          to="/games/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Добавить игру
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
      ></div>
    </div>

    <UiEmpty v-else-if="!games?.length" message="Игр пока нет. Добавьте свою первую игру!" />

    <Transition name="fade" mode="out-in">
      <EntitiesGamesCardsView
        v-if="viewMode === 'cards'"
        :games="filteredGames"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :search-query="searchQuery"
        @update-sorting="updateSorting"
        @update:searchQuery="updateSearchQuery"
      />
      <EntitiesGamesTableView
        v-else
        :games="filteredGames"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Game } from '~/types/api'

const config = useRuntimeConfig()

const error = ref('')

const viewMode = useCookie('watched_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortBy = useCookie('watched_sort_by', {
  default: () => 'completionDate',
  sameSite: 'lax',
})

const sortOrder = useCookie<'DESC' | 'ASC'>('watched_sort_order', {
  default: () => 'DESC',
  sameSite: 'lax',
})

const searchQuery = ref('')

const { data: games, pending: loading } = await useAsyncData<Game[]>(
  'games',
  async () => {
    try {
      error.value = ''
      return await _fetch<Game[]>(`${config.public.apiBase}/games`, {
        params: {
          sortBy: sortBy.value,
          sortOrder: sortOrder.value,
        },
      })
    } catch {
      error.value = 'Не удалось загрузить книги'
      return []
    }
  },
  {
    watch: [sortBy, sortOrder],
  },
)

const filteredGames = computed(() => {
  const list = games.value || []
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return list
  }

  return list.filter((game) => game.title?.toLowerCase().includes(query))
})

const updateSorting = (newSortBy: string) => {
  if (sortBy.value === newSortBy) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = newSortBy
    sortOrder.value = 'ASC'
  }
}

const updateSearchQuery = (value: string) => {
  searchQuery.value = value
}

watchEffect(() => {
  if (viewMode.value !== 'cards' && viewMode.value !== 'table') {
    viewMode.value = 'cards'
  }
})
</script>
