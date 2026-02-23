<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>

    <div class="mt-1 relative">
      <input
        :id="id"
        :value="displayValue"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :class="[
          'block w-full rounded-lg border py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:ring-2',
          suffix ? 'pl-3 pr-12' : 'px-3',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200',
          disabled ? 'disabled:cursor-not-allowed disabled:opacity-60' : '',
        ]"
        :placeholder="placeholder"
        @input="onInput"
      />
      <span
        v-if="suffix"
        class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400"
      >
        {{ suffix }}
      </span>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id: string
  label: string
  modelValue?: number
  min?: number
  max?: number
  step?: number
  placeholder?: string
  suffix?: string
  hint?: string
  error?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  min: undefined,
  max: undefined,
  step: 1,
  placeholder: '',
  suffix: '',
  hint: '',
  error: '',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const displayValue = computed(() => {
  return typeof props.modelValue === 'number' ? String(props.modelValue) : ''
})

const onInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value

  if (value === '') {
    emit('update:modelValue', undefined)
    return
  }

  const parsed = Number(value)
  emit('update:modelValue', Number.isNaN(parsed) ? undefined : parsed)
}
</script>
