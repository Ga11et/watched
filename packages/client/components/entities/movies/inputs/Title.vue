<template>
  <div>
    <div class="flex items-start gap-2">
      <CommonInputsTextInput
        id="title"
        v-model="model"
        label="Название"
        placeholder="например, Интерстеллар"
        hint="Обязательно."
        :error="error"
        :disabled="disabled"
        class="flex-1"
      />
      <button
        type="button"
        :disabled="disabled || loadingTmdb || !model.trim()"
        class="mt-6 h-10 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
        @click="emit('load-tmdb')"
      >
        <svg v-if="loadingTmdb" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        TMDB
      </button>
    </div>
    <p v-if="tmdbError" class="mt-1 text-sm text-red-600">{{ tmdbError }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  error?: string
  disabled?: boolean
  loadingTmdb?: boolean
  tmdbError?: string
}

withDefaults(defineProps<Props>(), {
  error: '',
  disabled: false,
  loadingTmdb: false,
  tmdbError: '',
})

const model = defineModel<string>('modelValue', { default: '' })
const emit = defineEmits<{ 'load-tmdb': [] }>()
</script>
