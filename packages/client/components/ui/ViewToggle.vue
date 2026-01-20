<template>
  <div class="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
    <button
      type="button"
      class="rounded-md px-3 py-1.5 text-sm transition"
      :class="
        modelValue === 'cards'
          ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600'
          : 'text-gray-600 hover:text-gray-900'
      "
      @click="$emit('update:modelValue', 'cards')"
    >
      Карточки
    </button>
    <button
      type="button"
      class="rounded-md px-3 py-1.5 text-sm transition"
      :class="
        modelValue === 'table'
          ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600'
          : 'text-gray-600 hover:text-gray-900'
      "
      @click="$emit('update:modelValue', 'table')"
    >
      Таблица
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: 'cards' | 'table'
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: 'cards' | 'table']
}>()
</script>
