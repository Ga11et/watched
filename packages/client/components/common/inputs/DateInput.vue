<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>

    <input
      :id="id"
      v-model="model"
      type="date"
      :disabled="disabled"
      :class="[
        'mt-1 block w-full h-10 rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:ring-2',
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200',
        disabled ? 'disabled:cursor-not-allowed disabled:opacity-60' : '',
      ]"
    />

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id: string
  label: string
  hint?: string
  error?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  hint: '',
  error: '',
  disabled: false,
})

const model = defineModel<string>('modelValue', { default: '' })
</script>
