<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>

    <div class="mt-1 relative">
      <input
        :id="id"
        v-model="model"
        :disabled="disabled"
        :class="[
          'block w-full rounded-lg border py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2 px-3',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200',
          disabled ? 'disabled:cursor-not-allowed disabled:opacity-60' : '',
        ]"
        :placeholder="placeholder"
      />
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id: string
  label: string
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  hint: '',
  error: '',
  disabled: false,
})
const model = defineModel<string>('modelValue', { default: '' })
</script>
