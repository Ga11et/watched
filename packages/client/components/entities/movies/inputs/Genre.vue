<template>
  <CommonInputsTextInput
    id="genre"
    v-model="model"
    label="Жанр"
    placeholder="например, Фантастика"
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
