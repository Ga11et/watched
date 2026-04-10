<template>
  <div>
    <IntegrationsTmdbPersonSearch
      id="fullName"
      v-model="selectedPerson"
      v-model:manual-query="model"
      label="Полное имя автора"
      placeholder="Найти автора..."
      :error="error"
      :disabled="disabled"
      required
    />
  </div>
</template>

<script setup lang="ts">
import type { TmdbPerson } from '~/types/api'

interface Props {
  error?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  error: '',
  disabled: false,
})

const model = defineModel<string>('modelValue', { default: '' })

const selectedPerson = ref<TmdbPerson | null>(null)

const emit = defineEmits<{
  select: [person: TmdbPerson]
}>()

watch(selectedPerson, (person) => {
  if (person) {
    model.value = person.name
    emit('select', person)
  }
})
</script>
