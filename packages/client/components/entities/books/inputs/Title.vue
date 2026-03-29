<template>
  <div>
    <label for="title" class="block text-sm font-medium text-gray-700">
      Название<span class="text-red-500">*</span>
    </label>
    <IntegrationsBookAutocomplete
      id="title"
      v-model="selectedBook"
      v-model:manual-query="model"
      placeholder="Найти книгу..."
      :error="error"
      :disabled="disabled"
      class="mt-1"
      @select="onBookSelect"
    />
  </div>
</template>

<script setup lang="ts">
import type { GoogleBook } from '~/components/integrations/google-books.service'

interface Props {
  error?: string
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  error: '',
  disabled: false,
})

const model = defineModel<string>('modelValue', { default: '' })

const selectedBook = ref<GoogleBook>()

const emit = defineEmits<{
  select: [book: GoogleBook]
}>()

const onBookSelect = (book: GoogleBook) => {
  model.value = book.title
  emit('select', book)
}
</script>
