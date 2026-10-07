<template>
  <CommonInputsDateInput
    id="watchedAt"
    v-model="model"
    label="Дата просмотра"
    hint="Когда вы посмотрели этот фильм? Оставьте пустым, чтобы убрать дату."
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

const model = defineModel<string>('modelValue', { default: '' })
</script>
