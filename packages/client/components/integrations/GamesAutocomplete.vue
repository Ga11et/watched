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
      <div v-if="loading" class="px-4 py-3 text-sm text-gray-500 text-center">Поиск игр...</div>

      <!-- No results -->
      <div
        v-else-if="searchResults.length === 0 && searchQuery"
        class="px-4 py-3 text-sm text-gray-500 text-center"
      >
        Игры не найдены
      </div>

      <!-- Results list -->
      <div v-else>
        <div
          v-for="(game, index) in searchResults"
          :key="game.id"
          class="px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
          :class="{
            'bg-indigo-50': highlightedIndex === index,
            'hover:bg-gray-50': highlightedIndex !== index,
          }"
          @mousedown="selectGame(game)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="flex items-start space-x-3">
            <!-- Game cover -->
            <div class="flex-shrink-0">
              <img
                v-if="game.cover"
                :src="game.cover"
                :alt="game.name"
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
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <!-- Game info -->
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 truncate">
                {{ game.name }}
              </div>
              <div v-if="game.platforms" class="text-sm text-gray-600 truncate">
                {{ game.platforms.join(', ') }}
              </div>
              <div v-if="game.releaseDate" class="text-xs text-gray-500">
                {{ game.releaseDate }}
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
import gamesSearchService, { type IGDBGame } from './igdb-games.service'

interface Props {
  modelValue?: IGDBGame | null
  manualQuery?: string
  placeholder?: string
  error?: string
}

interface Emits {
  (e: 'update:modelValue', value: IGDBGame | null): void
  (e: 'update:manualQuery', value: string): void
  (e: 'select', game: IGDBGame): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Поиск игры...',
})

const emit = defineEmits<Emits>()

const gamesService = new gamesSearchService(useRuntimeConfig().public.rawgApiKey)

const searchQuery = ref(props.modelValue?.name ?? '')
const searchResults = ref<IGDBGame[]>([])
const loading = ref(false)
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const inputRef = ref<HTMLInputElement>()

let searchTimeout: NodeJS.Timeout | null = null

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      searchQuery.value = newVal.name
    }
  },
)

watch(
  () => props.manualQuery,
  (newVal) => {
    if (newVal !== undefined) {
      searchQuery.value = newVal
    }
  },
)

const onSearch = () => {
  emit('update:manualQuery', searchQuery.value)

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
      const results = await gamesService.searchGames(searchQuery.value)
      searchResults.value = results
    } catch (error) {
      console.error('Search error:', error)
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const selectGame = (game: IGDBGame) => {
  searchQuery.value = game.name
  showDropdown.value = false
  emit('select', game)
  emit('update:modelValue', game)
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && searchResults.value[highlightedIndex.value]) {
    selectGame(searchResults.value[highlightedIndex.value])
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
  setTimeout(() => {
    closeDropdown()
  }, 200)
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
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
