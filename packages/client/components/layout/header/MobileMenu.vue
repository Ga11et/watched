<script setup lang="ts">
interface NavItem {
  to: string
  label: string
  iconPath: string
}

interface AddItem {
  to: string
  label: string
  className: string
}

defineProps<{
  open: boolean
  navItems: NavItem[]
  addItems: AddItem[]
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform scale-y-95 opacity-0"
    enter-to-class="transform scale-y-100 opacity-100"
    leave-active-class="transition duration-75 ease-in"
    leave-from-class="transform scale-y-100 opacity-100"
    leave-to-class="transform scale-y-95 opacity-0"
  >
    <div v-if="open" class="border-t border-gray-200/50 bg-white/80 backdrop-blur-sm lg:hidden">
      <div class="space-y-1 px-2 pb-3 pt-2">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="mobile-nav-link"
          @click="emit('close')"
        >
          <svg class="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
          </svg>
          {{ item.label }}
        </NuxtLink>

        <div class="mt-4 border-t border-gray-200/50 pb-3 pt-4">
          <div class="space-y-2 px-3">
            <NuxtLink
              v-for="item in addItems"
              :key="item.to"
              :to="item.to"
              class="mobile-add-btn"
              :class="item.className"
              @click="emit('close')"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.mobile-nav-link {
  @apply flex items-center rounded-lg px-3 py-2 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900;
}

.mobile-add-btn {
  @apply block w-full rounded-md border border-transparent px-4 py-2 text-center text-sm font-medium transition-colors;
}
</style>
