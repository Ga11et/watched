<template>
  <CommonInputsNumberInput
    id="rating"
    :model-value="modelValue"
    label="Оценка (0-100)"
    :min="0"
    :max="100"
    placeholder="например, 85"
    hint="Ваша личная оценка книги."
    :error="error"
    :disabled="disabled"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
interface Props {
  modelValue?: number
  error?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  error: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()
</script>
