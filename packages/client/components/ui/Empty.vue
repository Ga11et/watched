<template>
  <div class="text-center py-12 text-gray-500">
    {{ entityName.charAt(0).toUpperCase() + entityName.slice(1) }} пока нет. Добавьте свой первый
    {{ entityName }}!
  </div>
</template>

<script setup lang="ts">
interface Props {
  entityName: string
}

defineProps<Props>()
</script>
