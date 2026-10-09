<template>
  <div class="relative">
    <div class="relative">
      <input
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        :class="{ 'border-red-300 focus:ring-red-200': error }"
        @input="onSearch"
        @keydown.down="highlightNext"
        @keydown.up="highlightPrevious"
        @keydown.enter="selectHighlighted"
        @keydown.esc="closeDropdown"
        @blur="onBlur"
      />

      <div v-if="loading" class="absolute right-3 top-1/2 -translate-y-1/2 transform">
        <div class="h-4 w-4 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>

      <button
        v-else-if="searchQuery"
        type="button"
        class="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
        @click="clearSearch"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <div
      v-if="showDropdown && (searchResults.length > 0 || loading)"
      class="absolute z-10 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div v-if="loading" class="px-4 py-3 text-center text-sm text-gray-500">Поиск книг...</div>

      <div
        v-else-if="searchResults.length === 0 && searchQuery"
        class="px-4 py-3 text-center text-sm text-gray-500"
      >
        Книги не найдены
      </div>

      <div v-else>
        <div
          v-for="(book, index) in searchResults"
          :key="`${book.source}-${book.id}`"
          class="cursor-pointer border-b border-gray-100 px-4 py-3 transition-colors last:border-b-0"
          :class="{
            'bg-indigo-50': highlightedIndex === index,
            'hover:bg-gray-50': highlightedIndex !== index,
          }"
          @mousedown="selectBook(book)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <img
                v-if="book.cover"
                :src="normalizeCover(book.cover)"
                :alt="book.title"
                class="h-16 w-12 rounded object-cover"
                @error="onImageError"
              />
              <div v-else class="flex h-16 w-12 items-center justify-center rounded bg-gray-200">
                <svg
                  class="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <div class="truncate font-medium text-gray-900">{{ book.title }}</div>
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="
                    book.source === 'local'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-sky-100 text-sky-700'
                  "
                >
                  {{ book.source === 'local' ? 'Локальная' : 'Публичная' }}
                </span>
              </div>
              <div class="truncate text-sm text-gray-600">
                {{ book.authors?.join(', ') || 'Неизвестный автор' }}
              </div>
              <div v-if="book.publishedDate" class="text-xs text-gray-500">
                {{ book.publishedDate }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="selectedSource"
      class="mt-2 rounded-md border px-3 py-2 text-sm"
      :class="
        selectedSource === 'local'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-sky-200 bg-sky-50 text-sky-800'
      "
    >
      <span v-if="selectedSource === 'local'">Используется известная для приложения книга.</span>
      <span v-else>При создании книги будет создана новая книга в базе проекта.</span>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Book } from '~/types/api'
import { googleBooksService, type GoogleBook } from '~/components/integrations/google-books.service'

type SearchSource = 'local' | 'public'

export interface UserBookSearchResult {
  id: string
  title: string
  authors?: string[]
  description?: string
  cover?: string
  publishedDate?: string
  source: SearchSource
  localBook?: Book
  googleBook?: GoogleBook
}

interface Props {
  modelValue?: UserBookSearchResult | null
  manualQuery?: string
  placeholder?: string
  error?: string
}

interface Emits {
  (e: 'update:modelValue', value: UserBookSearchResult | null): void
  (e: 'update:manualQuery', value: string): void
  (e: 'select', value: UserBookSearchResult): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Поиск книги...',
})

const emit = defineEmits<Emits>()
const { request } = useApiRequest()
const config = useRuntimeConfig()

const searchQuery = ref(props.modelValue?.title ?? '')
const searchResults = ref<UserBookSearchResult[]>([])
const selectedSource = ref<SearchSource | null>(props.modelValue?.source ?? null)
const loading = ref(false)
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const inputRef = ref<HTMLInputElement>()

let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      searchQuery.value = newVal.title
      selectedSource.value = newVal.source
    }
  },
)

watch(
  () => props.manualQuery,
  (newVal) => {
    if (newVal !== undefined) {
      searchQuery.value = newVal
      if (!newVal.trim()) {
        selectedSource.value = null
      }
    }
  },
)

const mapLocalBook = (book: Book): UserBookSearchResult => ({
  id: book.id,
  title: book.title,
  authors: book.author?.fullName ? [book.author.fullName] : [],
  description: book.comment || undefined,
  cover: book.cover || undefined,
  publishedDate: book.publishYear ? String(book.publishYear) : undefined,
  source: 'local',
  localBook: book,
})

const mapPublicBook = (book: GoogleBook): UserBookSearchResult => ({
  id: book.id,
  title: book.title,
  authors: book.authors,
  description: book.description,
  cover: book.cover,
  publishedDate: book.publishedDate,
  source: 'public',
  googleBook: book,
})

const fetchLocalBooks = async (query: string): Promise<UserBookSearchResult[]> => {
  const term = query.trim()
  if (!term) return []

  try {
    const books = await request<Book[]>(`/books`, {
      params: {
        search: term,
        limit: 5,
      },
    })
    return books.map(mapLocalBook)
  } catch {
    return []
  }
}

const fetchPublicBooks = async (query: string): Promise<UserBookSearchResult[]> => {
  try {
    const books = await googleBooksService.searchBooks(query, 7)
    return books.map(mapPublicBook)
  } catch {
    return []
  }
}

const onSearch = () => {
  emit('update:manualQuery', searchQuery.value)
  selectedSource.value = null

  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!searchQuery.value.trim()) {
    searchResults.value = []
    showDropdown.value = false
    emit('update:modelValue', null)
    return
  }

  loading.value = true
  showDropdown.value = true
  highlightedIndex.value = -1

  searchTimeout = setTimeout(async () => {
    try {
      const localResults = await fetchLocalBooks(searchQuery.value)
      const publicResults = await fetchPublicBooks(searchQuery.value)
      searchResults.value = [...localResults, ...publicResults]
    } catch {
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const selectBook = (book: UserBookSearchResult) => {
  searchQuery.value = book.title
  selectedSource.value = book.source
  showDropdown.value = false

  emit('update:manualQuery', book.title)
  emit('update:modelValue', book)
  emit('select', book)
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && searchResults.value[highlightedIndex.value]) {
    selectBook(searchResults.value[highlightedIndex.value])
  }
}

const highlightNext = () => {
  if (searchResults.value.length === 0) return
  highlightedIndex.value = (highlightedIndex.value + 1) % searchResults.value.length
}

const highlightPrevious = () => {
  if (searchResults.value.length === 0) return
  highlightedIndex.value =
    highlightedIndex.value <= 0 ? searchResults.value.length - 1 : highlightedIndex.value - 1
}

const closeDropdown = () => {
  showDropdown.value = false
  highlightedIndex.value = -1
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  showDropdown.value = false
  selectedSource.value = null
  emit('update:manualQuery', '')
  emit('update:modelValue', null)
  inputRef.value?.focus()
}

const onBlur = () => {
  setTimeout(() => {
    closeDropdown()
  }, 200)
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const normalizeCover = (cover?: string) => {
  if (!cover) return ''
  return cover.startsWith('http') ? cover : `${config.public.apiBase}${cover}`
}

onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (!inputRef.value?.contains(event.target as Node)) {
      closeDropdown()
    }
  }

  document.addEventListener('click', handleClickOutside)

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
  })
})
</script>
