<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-1">{{ label }}</label>
    <div
      v-if="preview"
      :class="['rounded-lg overflow-hidden border border-gray-200 relative group', sizeClass]"
    >
      <img :src="preview" :alt="alt" class="w-full h-full object-cover" />
      <button
        type="button"
        @click="remove"
        class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
      >
        Удалить
      </button>
    </div>
    <label
      v-else
      :class="[
        'rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-xs cursor-pointer hover:border-indigo-400 hover:text-indigo-500 transition-colors',
        sizeClass,
      ]"
    >
      <svg class="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      {{ placeholder }}
      <input type="file" :accept="accept" class="hidden" @change="onFileChange" />
    </label>
    <p v-if="error" class="mt-1 text-sm text-red-600">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: File | null
  preview?: string | null
  label?: string
  placeholder?: string
  error?: string
  accept?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  preview: null,
  label: '',
  placeholder: 'Загрузить',
  error: '',
  accept: 'image/*',
  alt: 'Превью',
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: File | null]
  'update:preview': [value: string | null]
}>()

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-16 h-20'
    case 'lg':
      return 'w-32 h-40'
    default:
      return 'w-24 h-32'
  }
})

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    emit('update:modelValue', file)
    emit('update:preview', URL.createObjectURL(file))
  }
}

const remove = () => {
  if (props.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(props.preview)
  }
  emit('update:modelValue', null)
  emit('update:preview', null)
}
</script>
