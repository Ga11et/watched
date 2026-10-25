<template>
  <CommonInputsTextInput
    id="name"
    v-model="model"
    label="Имя"
    placeholder="Ваше имя"
    hint="Обязательно."
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
