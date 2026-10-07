<template>
  <CommonInputsTextareaInput
    id="comment"
    v-model="model"
    label="Комментарий"
    :rows="4"
    placeholder="Ваши впечатления о фильме"
    hint="Необязательно. Запишите краткое мнение о фильме."
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
