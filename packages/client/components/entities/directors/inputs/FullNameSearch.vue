<template>
  <div>
    <IntegrationsTmdbPersonSearch
      id="fullName"
      v-model="model"
      v-model:manual-query="manualQuery"
      label="ФИО"
      :required="true"
      :error="error"
      placeholder="например, Кристофер Нолан"
    />
    <p class="mt-2 text-xs text-gray-500">Выберите из подсказок или введите имя вручную</p>
  </div>
</template>

<script setup lang="ts">
import type { TmdbPerson } from '~/types/api'

interface Props {
  error?: string
}

withDefaults(defineProps<Props>(), {
  error: '',
})

const model = defineModel<TmdbPerson | null>('modelValue', { default: null })
const manualQuery = defineModel<string>('manualQuery', { default: '' })
</script>
