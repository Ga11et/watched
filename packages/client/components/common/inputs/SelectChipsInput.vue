<template>
  <div ref="rootRef" class="relative">
    <label :for="id" class="block text-sm font-medium text-gray-700">
      {{ label }}
    </label>

    <div
      :class="[
        'mt-1 h-10 rounded-lg border px-3 shadow-sm transition focus-within:ring-2',
        error
          ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-200'
          : 'border-gray-300 focus-within:border-indigo-500 focus-within:ring-indigo-200',
        disabled ? 'cursor-not-allowed opacity-60' : '',
      ]"
      @click="focusInput"
    >
      <div
        class="flex h-full items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap"
      >
        <span
          v-for="item in modelValue"
          :key="item.value"
          class="inline-flex h-6 flex-shrink-0 items-center gap-1 rounded-full bg-indigo-100 px-2 text-xs font-medium text-indigo-700"
        >
          {{ item.label }}
          <button
            type="button"
            class="rounded-full text-indigo-500 hover:text-indigo-700"
            :disabled="disabled"
            @click.stop="removeOption(item.value)"
          >
            <span class="sr-only">Удалить {{ item.label }}</span>
            ×
          </button>
        </span>

        <input
          :id="id"
          ref="inputRef"
          :value="searchQuery"
          type="text"
          :placeholder="inputPlaceholder"
          :disabled="disabled"
          class="h-full min-w-[8rem] flex-1 border-0 p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          @input="onInput"
          @focus="openDropdown"
        />
      </div>
    </div>

    <div
      v-if="isOpen && !disabled"
      class="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      <template v-if="loading">
        <div class="px-3 py-2 text-sm text-gray-500">Поиск...</div>
      </template>

      <template v-else>
        <button
          v-for="option in availableOptions"
          :key="option.value"
          type="button"
          class="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50"
          @mousedown.prevent="addOption(option)"
        >
          {{ option.label }}
        </button>

        <div
          v-if="!availableOptions.length && searchQuery.trim()"
          class="px-3 py-2 text-sm text-gray-500"
        >
          {{ noResultsText }}
        </div>
      </template>
    </div>

    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
interface SelectOption {
  value: string
  label: string
}

interface Props {
  id: string
  label: string
  modelValue: SelectOption[]
  options: SelectOption[]
  searchQuery?: string
  placeholder?: string
  searchPlaceholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  loading?: boolean
  noResultsText?: string
}

const props = withDefaults(defineProps<Props>(), {
  searchQuery: '',
  placeholder: 'Начните ввод для поиска',
  searchPlaceholder: 'Найти еще...',
  hint: '',
  error: '',
  disabled: false,
  loading: false,
  noResultsText: 'Ничего не найдено',
})

const emit = defineEmits<{
  'update:modelValue': [value: SelectOption[]]
  'update:searchQuery': [value: string]
}>()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)

const selectedValues = computed(() => new Set(props.modelValue.map((item) => item.value)))

const availableOptions = computed(() => {
  return props.options.filter((option) => !selectedValues.value.has(option.value))
})

const inputPlaceholder = computed(() => {
  if (props.modelValue.length === 0) {
    return props.placeholder
  }

  return props.searchPlaceholder
})

const onInput = (event: Event) => {
  emit('update:searchQuery', (event.target as HTMLInputElement).value)
  isOpen.value = true
}

const addOption = (option: SelectOption) => {
  if (selectedValues.value.has(option.value)) {
    return
  }

  emit('update:modelValue', [...props.modelValue, option])
  emit('update:searchQuery', '')
  isOpen.value = false
  focusInput()
}

const removeOption = (value: string) => {
  emit(
    'update:modelValue',
    props.modelValue.filter((item) => item.value !== value),
  )
}

const openDropdown = () => {
  isOpen.value = true
}

const focusInput = () => {
  if (props.disabled) {
    return
  }

  inputRef.value?.focus()
}

const onClickOutside = (event: MouseEvent) => {
  if (!rootRef.value?.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside)
})
</script>
