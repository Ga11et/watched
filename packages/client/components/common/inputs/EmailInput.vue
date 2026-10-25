<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>

    <div class="mt-1 relative">
      <input
        :id="id"
        v-model="model"
        type="email"
        :disabled="disabled"
        :class="[
          'block w-full h-10 rounded-lg border py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:ring-2 px-3',
          displayedError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200',
          disabled ? 'disabled:cursor-not-allowed disabled:opacity-60' : '',
        ]"
        :placeholder="placeholder"
      />
    </div>

    <p v-if="displayedError" class="mt-1 text-sm text-red-600">{{ displayedError }}</p>
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
// Пустое значение корректно: обязательность поля проверяет форма.
const valid = defineModel<boolean>('valid', { default: true })

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isValid = computed(() => {
  const value = model.value.trim()

  return !value || EMAIL_PATTERN.test(value)
})

watch(
  isValid,
  (value) => {
    valid.value = value
  },
  { immediate: true },
)

// Ошибка от формы или API приоритетнее собственной проверки формата.
const displayedError = computed(() => props.error || (isValid.value ? '' : 'Некорректный email'))
</script>
