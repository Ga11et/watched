<template>
  <CommonInputsTextareaInput
    id="comment"
    :model-value="modelValue"
    label="Комментарий"
    :rows="4"
    placeholder="Ваши мысли об игре"
    hint="Необязательно. Поделитесь яркими моментами, плюсами/минусами или впечатлениями."
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
