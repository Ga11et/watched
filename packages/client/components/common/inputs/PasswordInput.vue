<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>

    <div class="mt-1 relative">
      <input
        :id="id"
        v-model="model"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :class="[
          'block w-full h-10 rounded-lg border py-2 pl-3 pr-24 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:ring-2',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200',
          disabled ? 'disabled:cursor-not-allowed disabled:opacity-60' : '',
        ]"
        :placeholder="placeholder"
      />
      <button
        type="button"
        :disabled="disabled"
        :aria-controls="id"
        :aria-label="visible ? 'Скрыть пароль' : 'Показать пароль'"
        :aria-pressed="visible"
        class="absolute inset-y-0 right-0 rounded-r-lg px-3 text-xs font-medium text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        @click="visible = !visible"
      >
        {{ visible ? 'Скрыть' : 'Показать' }}
      </button>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id: string
  label: string
  autocomplete?: 'current-password' | 'new-password'
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  autocomplete: 'current-password',
  placeholder: '',
  hint: '',
  error: '',
  disabled: false,
})

const model = defineModel<string>('modelValue', { default: '' })
const visible = ref(false)

onDeactivated(() => {
  visible.value = false
})
</script>
