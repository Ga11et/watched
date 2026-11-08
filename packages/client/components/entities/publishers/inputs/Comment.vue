<template>
  <CommonInputsTextareaInput
    id="comment"
    v-model="model"
    label="Комментарий"
    :rows="3"
    placeholder="Дополнительная информация об издателе"
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
