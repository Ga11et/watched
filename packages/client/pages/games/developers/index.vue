<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs :items="breadcrumbItems" />

    <div
      v-if="error"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Разработчики</h2>
      <div class="flex items-center gap-3">
        <UiViewToggle v-model="viewMode" />
        <NuxtLink
          to="/games"
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Игры
        </NuxtLink>
        <NuxtLink
          to="/games/developers/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Добавить разработчика
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
      ></div>
    </div>

    <UiEmpty v-else-if="!developers?.length" entity-name="разработчик" />

    <Transition name="fade" mode="out-in">
      <EntitiesDevelopersCardsView
        v-if="viewMode === 'cards' && developers?.length"
        :developers="developers"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
      <EntitiesDevelopersTableView
        v-else-if="developers?.length"
        :developers="developers"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Developer } from '~/types/api'

const viewMode = useCookie<'cards' | 'table'>('watched_developers_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortBy = useCookie('watched_developers_sort_by', {
  default: () => 'fullName',
  sameSite: 'lax',
})

const sortOrder = useCookie<'ASC' | 'DESC'>('watched_developers_sort_order', {
  default: () => 'ASC',
  sameSite: 'lax',
})

const error = ref<string>('')
const config = useRuntimeConfig()

const { data: developers, pending: loading } = await useAsyncData<Developer[]>(
  'developers',
  async () => {
    try {
      error.value = ''
      return await $fetch<Developer[]>(`${config.public.apiBase}/developers`, {
        params: {
          sortBy: sortBy.value,
          sortOrder: sortOrder.value,
        },
      })
    } catch {
      error.value = 'Не удалось загрузить разработчиков'
      return []
    }
  },
  {
    watch: [sortBy, sortOrder],
  },
)

const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Игры', to: '/games' },
  { label: 'Разработчики' },
])

const updateSorting = (newSortBy: string): void => {
  if (sortBy.value === newSortBy) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = newSortBy
    sortOrder.value = 'ASC'
  }
}

watchEffect(() => {
  if (viewMode.value !== 'cards' && viewMode.value !== 'table') {
    viewMode.value = 'cards'
  }
})
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
