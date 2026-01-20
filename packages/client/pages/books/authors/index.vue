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
      <h2 class="text-2xl font-bold">Авторы</h2>
      <div class="flex items-center gap-3">
        <UiViewToggle v-model="viewMode" />
        <NuxtLink
          to="/books"
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Книги
        </NuxtLink>
        <NuxtLink
          to="/books/authors/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Добавить автора
        </NuxtLink>
      </div>
    </div>

    <div class="mb-6 flex items-center gap-4">
      <UiSorter v-model:sort-by="sortBy" v-model:sort-order="sortOrder" :options="sortOptions" />
    </div>

    <div v-if="loading" class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
      ></div>
    </div>

    <UiEmpty v-else-if="!authors?.length" entity-name="автор" />

    <Transition name="fade" mode="out-in">
      <EntitiesAuthorsCardsView
        v-if="viewMode === 'cards' && authors?.length"
        :authors="authors"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
        @deleted="handleDeleted"
      />
      <EntitiesAuthorsTableView
        v-else-if="authors?.length"
        :authors="authors"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
        @deleted="handleDeleted"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
interface Author {
  id: string
  name: string
  birthYear?: number
  deathYear?: number
  country?: string
  photo?: string
  createdAt: string
}

// 1. Конфигурация
const error = ref('')

// 2. Конфигурация и состояние
const viewMode = useCookie<'cards' | 'table'>('watched_authors_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortBy = useCookie('watched_authors_sort_by', {
  default: () => 'name',
  sameSite: 'lax',
})

const sortOrder = useCookie<'ASC' | 'DESC'>('watched_authors_sort_order', {
  default: () => 'ASC',
  sameSite: 'lax',
})

// 3. Загрузка данных
const {
  data: authors,
  refresh,
  pending: loading,
} = await useFetch<Author[]>(`${useRuntimeConfig().public.apiBase}/authors`, {
  query: { sortBy: sortBy.value, sortOrder: sortOrder.value },
})

// 4. Вычисляемые свойства
const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Книги', to: '/books' },
  { label: 'Авторы' },
])

const sortOptions = [
  { value: 'name', label: 'По имени' },
  { value: 'country', label: 'По стране' },
  { value: 'birthYear', label: 'По году рождения' },
  { value: 'createdAt', label: 'По дате добавления' },
]

// 5. Методы
const updateSorting = (newSortBy: string) => {
  if (sortBy.value === newSortBy) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = newSortBy
    sortOrder.value = 'ASC'
  }
  refresh()
}

// 6. Валидация

watchEffect(() => {
  if (viewMode.value !== 'cards' && viewMode.value !== 'table') {
    viewMode.value = 'cards'
  }
})

// 7. Обработчики событий
const handleDeleted = (id: string) => {
  refresh()
}
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
