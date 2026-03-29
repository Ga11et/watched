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
      <h1 class="text-2xl font-bold">Ваши книги</h1>

      <div class="flex items-center gap-3">
        <UiViewToggle v-model="viewMode" />
        <NuxtLink
          to="/books/authors"
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Авторы
        </NuxtLink>
        <NuxtLink
          to="/user-books/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Добавить книгу
        </NuxtLink>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
      ></div>
    </div>

    <UiEmpty v-else-if="!books?.length" message="Книг пока нет. Добавьте свою первую книгу!" />

    <Transition v-else name="fade" mode="out-in">
      <EntitiesUserBooksCardsView
        v-if="viewMode === 'cards'"
        :books="filteredBooks"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :search-query="searchQuery"
        @update-sorting="updateSorting"
        @update:searchQuery="updateSearchQuery"
      />
      <EntitiesUserBooksTableView
        v-else
        :books="filteredBooks"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { UserBook } from '~/types/api'

// 2. Конфигурация и состояние
const viewMode = useCookie<'cards' | 'table'>('watched_books_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortBy = useCookie('watched_books_sort_by', {
  default: () => 'createdAt',
  sameSite: 'lax',
})

const sortOrder = useCookie<'ASC' | 'DESC'>('watched_books_sort_order', {
  default: () => 'DESC',
  sameSite: 'lax',
})

const searchQuery = ref('')

// 3. Загрузка данных
const error = ref<string>('')
const config = useRuntimeConfig()

const { data: books, pending: loading } = await useAsyncData<UserBook[]>(
  'user-books',
  async () => {
    try {
      error.value = ''
      return await _fetch<UserBook[]>(`${config.public.apiBase}/user-books`, {
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

// 4. Вычисляемые свойства
const breadcrumbItems = computed(() => [{ label: 'Главная', to: '/' }, { label: 'Ваши книги' }])

const filteredBooks = computed(() => {
  const list = books.value || []
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return list
  }

  return list.filter((book) => {
    const title = (book.book?.title || '').toLowerCase()
    const author = (book.book?.authors?.[0]?.fullName || '').toLowerCase()
    return title.includes(query) || author.includes(query)
  })
})

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
