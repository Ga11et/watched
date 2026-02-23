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
      v-if="showDropdown && (results.length > 0 || loading)"
      class="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <div v-if="loading" class="px-4 py-3 text-center text-sm text-gray-500">Поиск издателей...</div>

      <div
        v-else-if="results.length === 0 && searchQuery"
        class="px-4 py-3 text-center text-sm text-gray-500"
      >
        Издатели не найдены
      </div>

      <div v-else>
        <div
          v-for="(item, index) in results"
          :key="item.id"
          class="cursor-pointer border-b border-gray-100 px-4 py-3 last:border-b-0 transition-colors"
          :class="{
            'bg-indigo-50': highlightedIndex === index,
            'hover:bg-gray-50': highlightedIndex !== index,
          }"
          @mousedown="selectItem(item)"
          @mouseenter="highlightedIndex = index"
        >
          <div class="font-medium text-gray-900">{{ item.name }}</div>
          <div v-if="item.gamesCount !== undefined" class="text-xs text-gray-500">
            Игр в RAWG: {{ item.gamesCount }}
          </div>
        </div>
      </div>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import GamesSearchService, { type RawgCompanySuggestion } from './igdb-games.service'

interface Props {
  modelValue?: RawgCompanySuggestion | null
  manualQuery?: string
  placeholder?: string
  error?: string
}

interface Emits {
  (e: 'update:modelValue', value: RawgCompanySuggestion | null): void
  (e: 'update:manualQuery', value: string): void
  (e: 'select', value: RawgCompanySuggestion): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Поиск издателя...',
})

const emit = defineEmits<Emits>()
const service = new GamesSearchService(useRuntimeConfig().public.rawgApiKey)

const searchQuery = ref(props.modelValue?.name ?? '')
const results = ref<RawgCompanySuggestion[]>([])
const loading = ref(false)
const showDropdown = ref(false)
const highlightedIndex = ref(-1)
const inputRef = ref<HTMLInputElement>()

let searchTimeout: ReturnType<typeof setTimeout> | null = null

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
    results.value = []
    showDropdown.value = false
    emit('update:modelValue', null)
    return
  }

  loading.value = true
  showDropdown.value = true
  highlightedIndex.value = -1

  searchTimeout = setTimeout(async () => {
    try {
      results.value = await service.searchPublishers(searchQuery.value)
    } catch (e) {
      console.error('Publisher autocomplete error:', e)
      results.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const selectItem = (item: RawgCompanySuggestion) => {
  searchQuery.value = item.name
  showDropdown.value = false
  emit('select', item)
  emit('update:modelValue', item)
  emit('update:manualQuery', item.name)
}

const selectHighlighted = () => {
  if (highlightedIndex.value >= 0 && results.value[highlightedIndex.value]) {
    selectItem(results.value[highlightedIndex.value])
  }
}

const highlightNext = () => {
  if (results.value.length === 0) return
  highlightedIndex.value = (highlightedIndex.value + 1) % results.value.length
}

const highlightPrevious = () => {
  if (results.value.length === 0) return
  highlightedIndex.value =
    highlightedIndex.value <= 0 ? results.value.length - 1 : highlightedIndex.value - 1
}

const closeDropdown = () => {
  showDropdown.value = false
  highlightedIndex.value = -1
}

const clearSearch = () => {
  searchQuery.value = ''
  results.value = []
  showDropdown.value = false
  emit('update:modelValue', null)
  emit('update:manualQuery', '')
  inputRef.value?.focus()
}

const onBlur = () => {
  setTimeout(() => {
    closeDropdown()
  }, 200)
}

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>
