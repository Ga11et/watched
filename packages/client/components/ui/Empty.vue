<template>
  <div class="text-center py-12 text-gray-500">{{ message }}</div>
</template>

<script setup lang="ts">
interface Props {
  message: string
}

const { message = 'Пусто' } = defineProps<Props>()
</script>
