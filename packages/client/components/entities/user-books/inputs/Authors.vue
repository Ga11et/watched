<template>
  <div class="flex items-start gap-2">
    <div class="flex-1">
      <CommonInputsSelectChipsInput
        id="authorIds"
        :model-value="selectedOptions"
        :options="options"
        :search-query="searchQuery"
        label="Авторы"
        placeholder="Найдите авторов по имени"
        search-placeholder="Добавить автора"
        hint="Можно выбрать несколько авторов"
        :error="error"
        :disabled="disabled"
        :loading="loading"
        no-results-text="Авторы не найдены"
        @update:model-value="onSelectedOptionsChange"
        @update:search-query="searchQuery = $event"
      />
    </div>

    <NuxtLink
      :to="{ path: '/books/authors/new', query: { redirectTo: route.fullPath } }"
      class="mt-6 h-10 inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      + Создать
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Author } from '~/types/api'

interface SelectOption {
  value: string
  label: string
}

interface Props {
  error?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  error: '',
  disabled: false,
})

const model = defineModel<Author[]>({ default: () => [] })

const { request } = useApiRequest()
const route = useRoute()

const searchQuery = ref('')
const loading = ref(false)
const options = ref<SelectOption[]>([])
const selectedOptions = ref<SelectOption[]>([])

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const authorMap = new Map<string, Author>()

const onSelectedOptionsChange = (value: SelectOption[]) => {
  selectedOptions.value = value
  model.value = value
    .map((item) => authorMap.get(item.value))
    .filter((a): a is Author => Boolean(a))
}

const syncSelectedOptions = (authors?: Author[]) => {
  if (!authors?.length) {
    selectedOptions.value = []
    return
  }

  authors.forEach((a) => authorMap.set(a.id, a))

  selectedOptions.value = authors.map((a) => ({
    value: a.id,
    label: a.fullName,
  }))
}

watch(
  model,
  (authors) => {
    syncSelectedOptions(authors)
  },
  { immediate: true },
)

watch(searchQuery, (query) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!query.trim()) {
    options.value = []
    loading.value = false
    return
  }

  loading.value = true

  searchTimeout = setTimeout(async () => {
    try {
      const results = await request<Author[]>(`/authors/search`, {
        params: { q: query.trim() },
      })

      results.forEach((a) => authorMap.set(a.id, a))

      options.value = results.map((author) => ({
        value: author.id,
        label: author.fullName,
      }))
    } catch (e) {
      console.warn('Failed to search authors:', e)
      options.value = []
    } finally {
      loading.value = false
    }
  }, 300)
})

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
})
</script>
