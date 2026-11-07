<template>
  <CommonInputsTextInput
    id="genres"
    v-model="model"
    label="Жанры"
    placeholder="Например: драма, комедия, боевик"
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
