<template>
  <div>
    <label for="fullName" class="block text-sm font-medium text-gray-700">
      Название разработчика<span class="text-red-500">*</span>
    </label>
    <IntegrationsDevelopersAutocomplete
      id="fullName"
      v-model="selectedDeveloper"
      v-model:manual-query="model"
      class="mt-1"
      placeholder="например, Larian Studios"
      :error="error"
      @select="emit('select', $event)"
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

const model = defineModel<string>('modelValue', { default: '' })
const emit = defineEmits<{ select: [developer: RawgCompanySuggestion] }>()

const selectedDeveloper = ref<RawgCompanySuggestion | null>(null)
</script>
