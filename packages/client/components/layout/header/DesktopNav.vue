<script setup lang="ts">
interface NavItem {
  to: string
  label: string
  iconPath: string
}

defineProps<{
  items: NavItem[]
}>()

const route = useRoute()
</script>

<template>
  <nav class="hidden items-center space-x-1 lg:flex">
    <NuxtLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="nav-link"
      :class="{ 'nav-link-active': route.path.startsWith(item.to) }"
    >
      <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
      </svg>
      {{ item.label }}
    </NuxtLink>
  </nav>
</template>

<style scoped>
.nav-link {
  @apply flex items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100 hover:text-gray-900;
}

.nav-link-active {
  @apply bg-indigo-50 text-indigo-600 hover:bg-indigo-100;
}
</style>
