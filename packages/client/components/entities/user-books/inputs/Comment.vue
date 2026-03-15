<template>
  <CommonInputsTextareaInput
    id="comment"
    :model-value="modelValue"
    label="Комментарий"
    :rows="4"
    placeholder="Ваши впечатления о книге"
    hint="Необязательно. Запишите краткое мнение о книге."
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
