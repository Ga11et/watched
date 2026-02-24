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

    <div v-if="loading" class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
      ></div>
    </div>

    <UiEmpty v-else-if="!authors?.length" entity-name="автор" />

    <Transition name="fade" mode="out-in">
      <EntitiesAuthorsCardsView
        v-if="viewMode === 'cards'"
        :authors="filteredAuthors"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :search-query="searchQuery"
        @update-sorting="updateSorting"
        @update:searchQuery="updateSearchQuery"
      />
      <EntitiesAuthorsTableView
        v-else
        :authors="filteredAuthors"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { Author } from '~/types/api'

// 1. Конфигурация
// 2. Конфигурация и состояние
const viewMode = useCookie<'cards' | 'table'>('watched_authors_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortBy = useCookie('watched_authors_sort_by', {
  default: () => 'fullName',
  sameSite: 'lax',
})

const sortOrder = useCookie<'ASC' | 'DESC'>('watched_authors_sort_order', {
  default: () => 'ASC',
  sameSite: 'lax',
})

const searchQuery = ref('')

// 3. Загрузка данных
const error = ref<string>('')
const config = useRuntimeConfig()

const { data: authors, pending: loading } = await useAsyncData<Author[]>(
  'authors',
  async () => {
    try {
      error.value = ''
      return await $fetch<Author[]>(`${config.public.apiBase}/authors`, {
        params: {
          sortBy: sortBy.value,
          sortOrder: sortOrder.value,
        },
      })
    } catch {
      error.value = 'Не удалось загрузить авторов'
      return []
    }
  },
  {
    watch: [sortBy, sortOrder],
  },
)

// 4. Вычисляемые свойства
const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Книги', to: '/books' },
  { label: 'Авторы' },
])

const filteredAuthors = computed(() => {
  const list = authors.value || []
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return list
  }

  return list.filter((author) => (author.fullName || '').toLowerCase().includes(query))
})

const sortOptions = [
  { value: 'fullName', label: 'По имени' },
  { value: 'createdAt', label: 'По дате добавления' },
]

// 5. Методы
const updateSorting = (newSortBy: string): void => {
  if (sortBy.value === newSortBy) {
    sortOrder.value = sortOrder.value === 'ASC' ? 'DESC' : 'ASC'
  } else {
    sortBy.value = newSortBy
    sortOrder.value = 'ASC'
  }
}

const updateSearchQuery = (value: string): void => {
  searchQuery.value = value
}

// 6. Валидация

watchEffect(() => {
  if (viewMode.value !== 'cards' && viewMode.value !== 'table') {
    viewMode.value = 'cards'
  }
})

// 7. Обработчики событий
// При использовании useAsyncData с watch данные обновляются автоматически
</script>
