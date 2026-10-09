<template>
  <div class="relative" ref="containerRef">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}<span v-if="required" class="text-red-500">*</span>
    </label>
    <input
      :id="id"
      v-model.trim="query"
      type="text"
      autocomplete="off"
      @input="onSearchInput"
      @focus="showSuggestions = true"
      :class="[
        'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
        error
          ? 'border-red-300 focus:ring-red-200'
          : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
      ]"
      :placeholder="placeholder"
    />
    <div
      v-if="showSuggestions && suggestions.length > 0"
      class="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto"
    >
      <button
        v-for="item in suggestions"
        :key="item.id"
        type="button"
        class="w-full px-3 py-2 text-left hover:bg-indigo-50 flex items-center gap-3 transition-colors"
        @click="selectMovie(item)"
      >
        <img
          v-if="item.poster_path"
          :src="`https://image.tmdb.org/t/p/w45${item.poster_path}`"
          :alt="item.title"
          class="w-8 h-12 rounded object-cover"
        />
        <div
          v-else
          class="w-8 h-12 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs"
        >
          ??
        </div>
        <div>
          <div class="text-sm font-medium text-gray-900">{{ item.title }}</div>
          <div v-if="item.release_date" class="text-xs text-gray-500">
            {{ item.release_date.slice(0, 4) }}
          </div>
        </div>
      </button>
    </div>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const TMDB_API_KEY = config.public.tmdbApiKey

export interface TmdbMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string | null
  genre_ids: number[]
  overview: string | null
}

interface Props {
  modelValue?: TmdbMovie | null
  manualQuery?: string
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  manualQuery: '',
  label: '',
  placeholder: 'Введите название фильма',
  error: '',
  required: false,
  id: 'tmdb-movie-search',
})

const emit = defineEmits<{
  'update:modelValue': [value: TmdbMovie | null]
  'update:manualQuery': [value: string]
}>()

const containerRef = ref<HTMLElement | null>(null)
const query = ref(props.modelValue?.title ?? props.manualQuery)
const suggestions = ref<TmdbMovie[]>([])
const showSuggestions = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      query.value = newVal.title
    }
  },
)

watch(
  () => props.manualQuery,
  (newVal) => {
    if (!props.modelValue) {
      query.value = newVal
    }
  },
)

const searchMovies = async (searchQuery: string) => {
  if (!searchQuery || searchQuery.length < 2) {
    suggestions.value = []
    return
  }

  try {
    const response = await $fetch<{ results: TmdbMovie[] }>(
      `https://api.themoviedb.org/3/search/movie`,
      {
        params: {
          api_key: TMDB_API_KEY,
          query: searchQuery,
          language: 'ru-RU',
        },
      },
    )
    suggestions.value = response.results.slice(0, 10)
  } catch (e) {
    console.error('TMDB search error:', e)
    suggestions.value = []
  }
}

const onSearchInput = () => {
  if (props.modelValue && query.value !== props.modelValue.title) {
    emit('update:modelValue', null)
  }
  emit('update:manualQuery', query.value)
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchMovies(query.value)
  }, 300)
}

const selectMovie = (selected: TmdbMovie) => {
  query.value = selected.title
  suggestions.value = []
  showSuggestions.value = false
  emit('update:modelValue', selected)
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (containerRef.value && !containerRef.value.contains(target)) {
    showSuggestions.value = false
  }
}
</script>
