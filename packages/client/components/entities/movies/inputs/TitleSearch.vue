<template>
  <div>
    <IntegrationsTmdbMovieSearch
      id="title"
      v-model="model"
      v-model:manual-query="manualQuery"
      label="Название"
      :required="true"
      :error="error"
      placeholder="например, Интерстеллар"
    />
    <p class="mt-2 text-xs text-gray-500">
      Выберите из подсказок TMDB или введите название вручную
    </p>
  </div>
</template>

<script setup lang="ts">
import type { TmdbMovie } from '~/types/api'

interface Props {
  error?: string
}

withDefaults(defineProps<Props>(), {
  error: '',
})

const model = defineModel<TmdbMovie | null>('modelValue', { default: null })
const manualQuery = defineModel<string>('manualQuery', { default: '' })
</script>
