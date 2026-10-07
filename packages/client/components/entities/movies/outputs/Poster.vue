<template>
  <div
    :class="size === 'sm' ? 'h-48 w-32' : 'h-56 w-40 rounded-lg'"
    class="flex-shrink-0 overflow-hidden"
  >
    <img v-if="poster" :src="posterUrl" :alt="alt" class="h-full w-full object-cover" />
    <div v-else class="flex h-full w-full items-center justify-center bg-gray-100">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-12 w-12 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 001 1v14a1 1 0 001 1z"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ poster?: string | null; alt: string; size?: 'sm' | 'lg' }>(),
  { size: 'lg' },
)

const config = useRuntimeConfig()
const posterUrl = computed(() => {
  if (!props.poster) return ''
  return /^https?:\/\//.test(props.poster)
    ? props.poster
    : `${config.public.apiBase}${props.poster}`
})
</script>
