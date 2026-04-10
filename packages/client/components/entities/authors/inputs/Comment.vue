<template>
  <CommonInputsTextareaInput
    id="authorComment"
    :model-value="modelValue"
    label="Комментарий"
    :rows="3"
    placeholder="Дополнительная информация об авторе"
    hint="Необязательно."
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
