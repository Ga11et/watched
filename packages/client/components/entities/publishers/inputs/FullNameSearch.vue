<template>
  <div>
    <label for="fullName" class="mb-1 block text-sm font-medium text-gray-700">
      Название издателя<span class="text-red-500">*</span>
    </label>
    <IntegrationsPublishersAutocomplete
      id="fullName"
      v-model="model"
      v-model:manual-query="manualQuery"
      placeholder="например, CD Projekt"
      :error="error"
    />
    <p class="mt-2 text-xs text-gray-500">Выберите из подсказок или введите название вручную</p>
  </div>
</template>

<script setup lang="ts">
import type { RawgCompanySuggestion } from '~/components/integrations/igdb-games.service'

interface Props {
  error?: string
}

withDefaults(defineProps<Props>(), {
  error: '',
})

const model = defineModel<RawgCompanySuggestion | null>('modelValue', { default: null })
const manualQuery = defineModel<string>('manualQuery', { default: '' })
</script>
