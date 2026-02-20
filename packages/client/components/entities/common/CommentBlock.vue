<template>
  <div v-if="comment" class="mt-6 border border-gray-200 rounded-lg overflow-hidden">
    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <div class="text-md font-medium text-gray-700">{{ title }}</div>
    </div>
    <div class="p-4">
      <div class="text-base text-gray-900 whitespace-pre-line">
        {{ comment }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  comment?: string | null
  title?: string
}

withDefaults(defineProps<Props>(), {
  comment: null,
  title: 'Комментарий',
})
</script>
