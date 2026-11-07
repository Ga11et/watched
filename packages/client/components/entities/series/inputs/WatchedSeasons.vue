<template>
  <CommonInputsNumberInput
    id="watchedSeasons"
    v-model="model"
    label="Просмотрено сезонов"
    :min="0"
    placeholder="0"
    :error="error"
    :disabled="disabled"
  />
</template>

<script setup lang="ts">
interface Props {
  error?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  error: '',
  disabled: false,
})

const model = defineModel<number | undefined>('modelValue', { default: undefined })
</script>
