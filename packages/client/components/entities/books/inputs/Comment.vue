<template>
  <CommonInputsTextareaInput
    id="comment"
    :model-value="modelValue"
    label="Описание"
    :rows="4"
    placeholder="Описание книги..."
    hint="Необязательно. Краткое описание или аннотация книги."
    :error="error"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string
  error?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  error: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
