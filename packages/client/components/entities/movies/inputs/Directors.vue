<template>
  <div class="flex items-start gap-2">
    <div class="min-w-0 flex-1">
      <CommonInputsSelectChipsInput
        id="directorIds"
        v-model:search-query="searchQuery"
        :model-value="selectedOptions"
        :options="options"
        label="Режиссёры"
        placeholder="Найдите режиссёров по имени"
        search-placeholder="Добавить режиссёра"
        hint="Можно выбрать несколько режиссёров"
        :error="error || (loadError ? 'Не удалось загрузить режиссёров' : '')"
        :disabled="disabled"
        :loading="status === 'pending'"
        no-results-text="Режиссёры не найдены"
        @update:model-value="model = $event.map((item) => item.value)"
      />
    </div>

    <NuxtLink
      :to="{ path: '/movies/directors/new', query: { redirectTo: route.fullPath } }"
      class="mt-6 h-10 inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      + Создать
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Director } from '~/types/api'

withDefaults(defineProps<{ error?: string; disabled?: boolean }>(), {
  error: '',
  disabled: false,
})

const model = defineModel<string[]>({ default: () => [] })
const { request } = useApiRequest()
const route = useRoute()
const searchQuery = ref('')

const {
  data: directors,
  status,
  error: loadError,
} = await useAsyncData('movie-director-options', () => request<Director[]>(`/directors`))

const directorOptions = computed(() =>
  (directors.value || []).map((director) => ({
    value: director.id,
    label: director.fullName,
  })),
)

const selectedOptions = computed(() =>
  model.value.map(
    (id) => directorOptions.value.find((option) => option.value === id) ?? { value: id, label: id },
  ),
)

const options = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return directorOptions.value.filter((option) => option.label.toLowerCase().includes(query))
})
</script>
