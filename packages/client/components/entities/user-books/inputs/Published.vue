<template>
  <CommonInputsTextInput
    id="publishYear"
    v-model="model"
    label="Год издания"
    placeholder="например: 2023"
    hint="Когда книга была издана?"
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
