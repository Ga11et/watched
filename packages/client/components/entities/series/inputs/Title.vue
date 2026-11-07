<template>
  <div>
    <IntegrationsTmdbSeriesSearch
      id="title"
      v-model:manual-query="model"
      :model-value="selectedSeries"
      label="Название"
      :required="true"
      placeholder="например, Во все тяжкие"
      :error="error"
      :disabled="disabled"
      @update:model-value="onSelect"
    />
    <p class="mt-2 text-xs text-gray-500">
      Выберите из подсказок TMDB или введите название вручную
    </p>
  </div>
</template>

<script setup lang="ts">
import type { TmdbSeries } from '~/types/api'

interface Props {
  error?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  error: '',
  disabled: false,
})

const model = defineModel<string>('modelValue', { default: '' })
const emit = defineEmits<{ select: [series: TmdbSeries] }>()

const selectedSeries = ref<TmdbSeries | null>(null)

const onSelect = (series: TmdbSeries | null) => {
  selectedSeries.value = series
  if (!series) return

  model.value = series.name
  emit('select', series)
}
</script>
