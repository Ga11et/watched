<template>
  <CommonInputsNumberInput
    id="releaseYear"
    v-model="model"
    label="Год выхода"
    :min="1888"
    :max="new Date().getFullYear() + 5"
    placeholder="например, 2014"
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

const model = defineModel<number>('modelValue')
</script>
