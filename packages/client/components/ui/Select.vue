<template>
  <div class="relative">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <div class="relative">
      <button
        type="button"
        @click="toggleDropdown"
        class="h-[38px] relative w-full cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
        :class="{ 'ring-2 ring-indigo-500 border-indigo-500': isOpen }"
      >
        <span class="block truncate" :class="{ 'text-gray-500': !selectedOption }">
          {{ displayText }}
        </span>
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            class="h-5 w-5 text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-180': isOpen }"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 010-1.06z"
              clip-rule="evenodd"
            />
          </svg>
        </span>
      </button>

      <Transition
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isOpen"
          class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm min-w-fit"
        >
          <div
            v-for="option in options"
            :key="option.value"
            @click="selectOption(option)"
            class="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-indigo-50 transition-colors"
            :class="{ 'bg-indigo-100 text-indigo-900': selectedValue === option.value }"
          >
            <span
              class="block truncate"
              :class="{
                'font-normal': selectedValue !== option.value,
                'font-semibold': selectedValue === option.value,
              }"
            >
              {{ option.label }}
            </span>
            <span
              v-if="selectedValue === option.value"
              class="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600"
            >
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  modelValue?: string
  label?: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Выберите опцию',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (value !== undefined) {
      emit('update:modelValue', value)
    }
  },
})

const selectedOption = computed(() =>
  props.options.find((option) => option.value === selectedValue.value),
)

const displayText = computed(() => selectedOption.value?.label || props.placeholder)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const selectOption = (option: Option) => {
  selectedValue.value = option.value
  isOpen.value = false
}

const closeDropdown = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>
