<template>
  <CommonInputsTextInput
    id="rating"
    v-model="model"
    label="Жанр"
    placeholder="например: Фантастика, Детектив"
    :error
    :disabled
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
