<template>
  <div :class="containerClass">
    <img v-if="photo" :src="resolvedUrl" :alt="alt" class="h-full w-full object-cover" />
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
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  photo?: string | null
  alt?: string
  size?: 'sm' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  photo: null,
  alt: '',
  size: 'lg',
})

const config = useRuntimeConfig()

const resolvedUrl = computed(() => {
  if (!props.photo) return ''
  return props.photo.startsWith('http')
    ? props.photo
    : `${config.public.apiBase}${props.photo}`
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
