<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>

    <textarea
      :id="id"
      :value="modelValue"
      :rows="rows"
      :disabled="disabled"
      :class="[
        'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2',
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200',
        disabled ? 'disabled:cursor-not-allowed disabled:opacity-60' : '',
      ]"
      :placeholder="placeholder"
      @input="onInput"
    ></textarea>

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id: string
  label: string
  modelValue?: string
  rows?: number
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  rows: 4,
  placeholder: '',
  hint: '',
  error: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>
