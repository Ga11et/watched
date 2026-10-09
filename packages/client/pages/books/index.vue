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
      <h1 class="text-2xl font-bold">Справочник: книги</h1>
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

    <UiEmpty v-else-if="!books?.length" message="Книг пока нет. Добавьте свою первую книгу!" />

    <Transition name="fade" mode="out-in">
      <EntitiesBooksCardsView
        v-if="viewMode === 'cards'"
        :books="filteredBooks"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :search-query="searchQuery"
        @update-sorting="updateSorting"
        @update:searchQuery="updateSearchQuery"
      />
      <EntitiesBooksTableView
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
import type { Book } from '~/types/api'

const { request } = useApiRequest()

// 2. Конфигурация и состояние
const viewMode = useCookie<'cards' | 'table'>('watched_books_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const sortFields = ['title', 'genre', 'publishYear', 'createdAt'] as const
const legacyCookieOptions = { readonly: true as const, decode: decodeURIComponent }
const legacySortBy = useCookie<string | null>('watched_books_sort_by', legacyCookieOptions)
const legacySortOrder = useCookie<string | null>('watched_books_sort_order', legacyCookieOptions)
const migratedSortBy = legacySortBy.value === 'publishedYear' ? 'publishYear' : legacySortBy.value
const cookieOptions = { sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 365 }

const sortBy = useCookie<string>('watched_book_catalogue_sort_by', {
  ...cookieOptions,
  default: () => sortFields.find((field) => field === migratedSortBy) ?? 'createdAt',
})

const sortOrder = useCookie<'ASC' | 'DESC'>('watched_book_catalogue_sort_order', {
  ...cookieOptions,
  default: () => (legacySortOrder.value === 'ASC' ? 'ASC' : 'DESC'),
})

watchEffect(() => {
  if (!sortFields.some((field) => field === sortBy.value)) sortBy.value = 'createdAt'
  if (sortOrder.value !== 'ASC' && sortOrder.value !== 'DESC') sortOrder.value = 'DESC'
})

const searchQuery = ref('')

// 3. Загрузка данных
const error = ref<string>('')

const { data: books, pending: loading } = await useAsyncData<Book[]>('books', async () => {
  try {
    error.value = ''
    return await request<Book[]>(`/books`)
  } catch {
    error.value = 'Не удалось загрузить книги'
    return []
  }
})

// 4. Вычисляемые свойства
const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Справочник: книги' },
])

type SortValue = string | number | null | undefined
type SortValueType = 'string' | 'number' | 'date'

const collator = new Intl.Collator('ru')
const normalizeSortValue = (value: SortValue, type: SortValueType): string | number | null => {
  if (value == null || (typeof value === 'string' && !value.trim())) return null
  if (type === 'string') return String(value)
  const numericValue = type === 'date' ? Date.parse(String(value)) : Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

const filteredBooks = computed(() => {
  const list = books.value || []
  const query = searchQuery.value.trim().toLowerCase()

  const filtered = list.filter((book) => {
    const title = (book.title || '').toLowerCase()
    const author = (book.authors?.[0]?.fullName || '').toLowerCase()
    return !query || title.includes(query) || author.includes(query)
  })
  const field = sortFields.find((field) => field === sortBy.value) ?? 'createdAt'
  const type = field === 'publishYear' ? 'number' : field === 'createdAt' ? 'date' : 'string'
  const direction = sortOrder.value === 'ASC' ? 1 : -1
  return filtered.sort((left, right) => {
    const a = normalizeSortValue(left[field], type)
    const b = normalizeSortValue(right[field], type)
    let comparison = 0
    if (a == null) comparison = b == null ? 0 : 1
    else if (b == null) comparison = -1
    else {
      comparison =
        direction *
        (typeof a === 'string' && typeof b === 'string'
          ? collator.compare(a, b)
          : Number(a) - Number(b))
    }
    return comparison || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
  })
})

// 5. Методы
const updateSorting = (newSortBy: string): void => {
  if (!sortFields.some((field) => field === newSortBy)) return
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
