<script setup lang="ts">
const props = defineProps<{
  isAuthenticated: boolean
  currentUserName: string
  currentUserRole: string
  showProfileMenu: boolean
}>()

const emit = defineEmits<{
  toggleProfile: []
  closeProfile: []
  toggleMobile: []
  logout: []
}>()

const profileMenuRoot = ref<HTMLElement | null>(null)

const handleDocumentClick = (event: MouseEvent) => {
  if (!props.showProfileMenu || !profileMenuRoot.value) {
    return
  }

  const target = event.target
  if (!(target instanceof Node)) {
    return
  }

  if (!profileMenuRoot.value.contains(target)) {
    emit('closeProfile')
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div class="flex items-center space-x-3">
    <div v-if="isAuthenticated" ref="profileMenuRoot" class="relative">
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        @click="emit('toggleProfile')"
      >
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 shadow-sm"
        >
          <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <div class="hidden min-w-0 md:block">
          <p class="truncate text-sm font-semibold leading-none text-gray-900">
            {{ currentUserName }}
          </p>
          <p class="mt-1 truncate text-xs leading-none text-gray-500">{{ currentUserRole }}</p>
        </div>
      </button>

      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="showProfileMenu"
          class="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-gray-100 bg-white shadow-lg ring-1 ring-black ring-opacity-5"
        >
          <div class="py-2">
            <div class="border-b border-gray-100 px-4 py-2 text-xs font-medium text-gray-500">
              Профиль
            </div>
            <NuxtLink to="/profile" class="dropdown-item" @click="emit('toggleProfile')">
              <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5.121 17.804A9.953 9.953 0 0012 20c2.52 0 4.822-.93 6.579-2.466M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Страница профиля
            </NuxtLink>
            <div class="mt-2 border-t border-gray-100 pt-2">
              <button
                type="button"
                class="dropdown-item w-full text-left text-red-600 hover:bg-red-50"
                @click="emit('logout')"
              >
                <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Выйти
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <NuxtLink
      v-else
      to="/login"
      class="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      Войти
    </NuxtLink>

    <button
      type="button"
      class="inline-flex items-center justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-inset lg:hidden"
      @click="emit('toggleMobile')"
    >
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.dropdown-item {
  @apply flex items-center px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50;
}
</style>
