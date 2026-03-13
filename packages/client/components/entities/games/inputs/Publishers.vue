<template>
  <div class="flex items-start gap-2">
    <div class="flex-1">
      <CommonInputsSelectChipsInput
        id="publisherIds"
        :model-value="selectedOptions"
        :options="options"
        :search-query="searchQuery"
        label="Издатели"
        placeholder="Найдите издателей по имени"
        search-placeholder="Добавить издателя"
        hint="Можно выбрать несколько издателей"
        :error="error"
        :disabled="disabled"
        :loading="loading || resolvingSelected"
        no-results-text="Издатели не найдены"
        @update:model-value="onSelectedOptionsChange"
        @update:search-query="searchQuery = $event"
      />
    </div>

    <NuxtLink
      :to="{ path: '/games/publishers/new', query: { redirectTo: route.fullPath } }"
      class="mt-6 h-10 inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      + Создать
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Publisher } from '~/types/api'

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
        missingIds.map((id) => _fetch<Publisher>(`${config.public.apiBase}/publishers/${id}`)),
      )

      loadedItems.forEach((publisher) => {
        currentMap.set(publisher.id, {
          value: publisher.id,
          label: publisher.fullName,
        })
      })
    } catch (e) {
      console.warn('Failed to load selected publishers:', e)
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
      const results = await _fetch<Publisher[]>(`${config.public.apiBase}/publishers/search`, {
        params: { q: query.trim() },
      })

      options.value = results.map((publisher) => ({
        value: publisher.id,
        label: publisher.fullName,
      }))
    } catch (e) {
      console.warn('Failed to search publishers:', e)
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
