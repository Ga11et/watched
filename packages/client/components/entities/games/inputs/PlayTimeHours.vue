<template>
  <CommonInputsNumberInput
    id="playTimeHours"
    :model-value="modelValue"
    label="Время в игре (часы)"
    :min="0"
    :step="0.5"
    suffix="ч"
    placeholder="например, 12.5"
    hint="Примерное общее время в игре."
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
