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
      <h2 class="text-2xl font-bold">Книги</h2>
      <div class="flex items-center gap-3">
        <UiViewToggle v-model="viewMode" />
        <NuxtLink
          to="/books/authors"
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Авторы
        </NuxtLink>
        <NuxtLink
          to="/books/new"
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

    <UiEmpty v-else-if="!books?.length" entity-name="книга" />

    <Transition name="fade" mode="out-in">
      <EntitiesBooksCardsView
        v-if="viewMode === 'cards' && books?.length"
        :books="books"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        @update-sorting="updateSorting"
        @deleted="handleDeleted"
      />
      <EntitiesBooksTableView
        v-else-if="books?.length"
        :books="books"
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
}

interface Book {
  id: string
  title: string
  description?: string
  publishedYear?: number
  genre?: string
  pages?: number
  cover?: string
  author?: Author
  createdAt: string
}

// 1. Конфигурация
const error = ref('')

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

// 3. Загрузка данных
const {
  data: books,
  refresh,
  pending: loading,
} = await useFetch<Book[]>(`${useRuntimeConfig().public.apiBase}/books`, {
  query: { sortBy: sortBy.value, sortOrder: sortOrder.value },
})

// 4. Вычисляемые свойства
const breadcrumbItems = computed(() => [{ label: 'Главная', to: '/' }, { label: 'Книги' }])

const sortOptions = [
  { value: 'title', label: 'Название' },
  { value: 'publishedYear', label: 'Год издания' },
  { value: 'pages', label: 'Страниц' },
  { value: 'createdAt', label: 'Дата добавления' },
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
