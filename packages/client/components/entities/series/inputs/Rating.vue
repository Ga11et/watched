<template>
  <CommonInputsNumberInput
    id="rating"
    v-model="model"
    label="Рейтинг"
    :min="0"
    :max="100"
    :step="0.1"
    placeholder="0-100"
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
