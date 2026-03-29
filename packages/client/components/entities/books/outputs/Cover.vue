<template>
  <div :class="containerClass">
    <img v-if="cover" :src="resolvedUrl" :alt="alt" class="h-full w-full object-cover" />
    <div v-else class="flex h-full w-full items-center justify-center bg-gray-100">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        :class="iconClass"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          :stroke-width="size === 'sm' ? 1.5 : 2"
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  cover?: string | null
  alt?: string
  size?: 'sm' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  cover: null,
  alt: '',
  size: 'lg',
})

const config = useRuntimeConfig()

const resolvedUrl = computed(() => {
  if (!props.cover) return ''
  return props.cover.startsWith('http')
    ? props.cover
    : `${config.public.apiBase}${props.cover}`
})

const containerClass = computed(() => {
  return props.size === 'sm'
    ? 'h-48 w-32 flex-shrink-0 overflow-hidden'
    : 'h-56 w-40 flex-shrink-0 overflow-hidden rounded-lg'
})

const iconClass = computed(() => {
  return props.size === 'sm'
    ? 'h-16 w-12 text-gray-300'
    : 'h-12 w-12 text-gray-300'
})
</script>
