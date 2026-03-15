<template>
  <CommonInputsDateInput
    id="readAt"
    v-model="model"
    label="Дата прочтения"
    hint="Когда вы прочитали эту книгу?"
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
