<template>
  <CommonInputsEmailInput
    id="email"
    v-model="model"
    v-model:valid="valid"
    label="Email"
    placeholder="you@example.com"
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
const valid = defineModel<boolean>('valid', { default: true })
</script>
