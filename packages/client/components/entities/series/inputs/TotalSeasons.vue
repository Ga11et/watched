<template>
  <CommonInputsNumberInput
    id="totalSeasons"
    v-model="model"
    label="Всего сезонов"
    :min="1"
    placeholder="0"
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

const model = defineModel<number | undefined>('modelValue', { default: undefined })
</script>
