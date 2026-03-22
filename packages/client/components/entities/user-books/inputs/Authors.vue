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
        :loading="loading || resolvingSelected"
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
  modelValue?: string[]
  error?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  error: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const config = useRuntimeConfig()
const route = useRoute()

const searchQuery = ref('')
const loading = ref(false)
const resolvingSelected = ref(false)
const options = ref<SelectOption[]>([])
const selectedOptions = ref<SelectOption[]>([])

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const onSelectedOptionsChange = (value: SelectOption[]) => {
  selectedOptions.value = value
  emit(
    'update:modelValue',
    value.map((item) => item.value),
  )
}

const syncSelectedOptions = async (ids?: string[]) => {
  if (!ids?.length) {
    selectedOptions.value = []
    return
  }

  const currentMap = new Map(selectedOptions.value.map((option) => [option.value, option]))
  const missingIds = ids.filter((id) => !currentMap.has(id))

  if (missingIds.length > 0) {
    resolvingSelected.value = true
    try {
      const loadedItems = await Promise.all(
        missingIds.map((id) => _fetch<Author>(`${config.public.apiBase}/authors/${id}`)),
      )

      loadedItems.forEach((author) => {
        currentMap.set(author.id, {
          value: author.id,
          label: author.fullName,
        })
      })
    } catch (e) {
      console.warn('Failed to load selected authors:', e)
    } finally {
      resolvingSelected.value = false
    }
  }

  selectedOptions.value = ids
    .map((id) => currentMap.get(id))
    .filter((option): option is SelectOption => Boolean(option))
}

watch(
  () => props.modelValue,
  (ids) => {
    void syncSelectedOptions(ids)
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
      const results = await _fetch<Author[]>(`${config.public.apiBase}/authors/search`, {
        params: { q: query.trim() },
      })

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
