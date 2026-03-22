<template>
  <CommonInputsNumberInput
    id="pageCount"
    v-model="model"
    label="Количество страниц"
    :min="1"
    placeholder="например: 350"
    hint="Количество страниц в книге"
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

const model = defineModel<number>('modelValue', { default: undefined })
</script>
