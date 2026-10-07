<template>
  <CommonInputsNumberInput
    id="rating"
    v-model="model"
    label="Оценка (0-100)"
    :min="0"
    :max="100"
    :step="1"
    placeholder="например, 85"
    hint="Ваша личная оценка фильма. Оставьте пустым, чтобы убрать оценку."
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

const model = defineModel<number>('modelValue')
</script>
