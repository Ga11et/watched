<template>
  <CommonInputsDateInput
    id="completionDate"
    :model-value="modelValue"
    label="Дата прохождения"
    hint="Когда вы прошли эту игру?"
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
