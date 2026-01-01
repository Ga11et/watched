<template>
  <ClientOnly>
    <span class="flex w-28 leading-5">{{ formatDate(date) }}</span>
    <template #fallback>
      <span class="flex w-28 h-5 rounded bg-gray-200"></span>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
interface Props {
  date?: string | null
}

defineProps<Props>()

function formatDate(d?: string | null) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  // Format on client; choose a stable format to avoid flicker if hot reloading
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC' }).format(date)
}
</script>
