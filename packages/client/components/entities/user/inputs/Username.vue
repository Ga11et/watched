<template>
  <CommonInputsTextInput
    id="username"
    v-model="model"
    label="Логин"
    placeholder="username"
    hint="Латинские буквы, цифры и подчёркивания, до 50 символов."
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
