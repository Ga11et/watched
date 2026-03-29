<template>
  <div class="relative">
    <div class="relative">
      <input
        ref="inputRef"
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="block w-full h-10 rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        :class="{ 'border-red-300 focus:ring-red-200': error }"
        @input="onSearch"
        @keydown.down="highlightNext"
        @keydown.up="highlightPrevious"
        @keydown.enter="selectHighlighted"
        @keydown.esc="closeDropdown"
        @blur="onBlur"
      />

      <!-- Loading indicator -->
      <div v-if="loading" class="absolute right-3 top-1/2 transform -translate-y-1/2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Clear button -->
      <button
        v-else-if="searchQuery"
        type="button"
        class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        @click="clearSearch"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Dropdown with results -->
    <div
      v-if="showDropdown && (searchResults.length > 0 || loading)"
      class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
    >
      <!-- Loading state -->
      <div v-if="loading" class="px-4 py-3 text-sm text-gray-500 text-center">Поиск книг...</div>

      <!-- No results -->
      <div
        v-else-if="searchResults.length === 0 && searchQuery"
        class="px-4 py-3 text-sm text-gray-500 text-center"
      >
        Книги не найдены
      </div>

      <!-- Results list -->
      <div v-else>
        <div
          v-for="(book, index) in searchResults"
          :key="book.id"
          class="px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
          :class="{
            'bg-indigo-50': highlightedIndex === index,
            'hover:bg-gray-50': highlightedIndex !== index,
          }"
          @mousedown="selectBook(book)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="flex items-start space-x-3">
            <!-- Book cover -->
            <div class="flex-shrink-0">
              <img
                v-if="book.cover"
                :src="book.cover"
                :alt="book.title"
                class="w-12 h-16 object-cover rounded"
                @error="onImageError"
              />
              <div v-else class="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-gray-400"
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

            <!-- Book info -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 truncate">
                {{ book.title }}
              </div>
              <div class="text-sm text-gray-600 truncate">
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

    <!-- Error message -->
    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { googleBooksService, type GoogleBook } from './google-books.service'

interface Props {
  placeholder?: string
  error?: string
}

interface Emits {
  (e: 'select', book: GoogleBook): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Поиск книги...',
})

const emit = defineEmits<Emits>()

const model = defineModel<GoogleBook>('modelValue', { default: undefined })
const manualQuery = defineModel<string>('manualQuery', { default: '' })

const searchQuery = ref(model.value?.title ?? '')
const searchResults = ref<GoogleBook[]>([])
const loading = ref(false)
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const inputRef = ref<HTMLInputElement>()

let searchTimeout: NodeJS.Timeout | null = null

// Следим за изменением modelValue
watch(model, (newVal) => {
  if (newVal) {
    searchQuery.value = newVal.title
  }
})

// Следим за изменением manualQuery
watch(manualQuery, (newVal) => {
  if (newVal !== undefined) {
    searchQuery.value = newVal
  }
})

const onSearch = () => {
  manualQuery.value = searchQuery.value

  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!searchQuery.value.trim()) {
    searchResults.value = []
    showDropdown.value = false
    return
  }

  loading.value = true
  showDropdown.value = true
  highlightedIndex.value = -1

  searchTimeout = setTimeout(async () => {
    try {
      const results = await googleBooksService.searchBooks(searchQuery.value)
      searchResults.value = results
    } catch (error) {
      console.error('Search error:', error)
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const selectBook = (book: GoogleBook) => {
  searchQuery.value = book.title
  showDropdown.value = false
  emit('select', book)
  model.value = book
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
  inputRef.value?.focus()
}

const onBlur = () => {
  // Закрываем дропдаун с небольшой задержкой, чтобы успеть кликнуть на опцию
  setTimeout(() => {
    closeDropdown()
  }, 200)
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// Закрываем дропдаун при клике вне компонента
onMounted(() => {
  searchQuery.value = manualQuery.value

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
