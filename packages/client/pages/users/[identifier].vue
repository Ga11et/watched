<script setup lang="ts">
interface User {
  id: string
  username: string | null
  email: string | null
  name: string
  role: 'ADMIN' | 'USER' | 'GUEST'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const config = useRuntimeConfig()

const identifier = computed(() => String(route.params.identifier ?? ''))

const {
  data: user,
  pending,
  error,
} = await useAsyncData<User | null>(
  () => `user-${identifier.value}`,
  async () => {
    if (!identifier.value) return null
    return _fetch<User>(`${config.public.apiBase}/users/${identifier.value}`)
  },
  {
    watch: [identifier],
  },
)
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Пользователи', to: '/users' },
        { label: user?.name || 'Профиль пользователя' },
      ]"
    />

    <div v-if="pending" class="py-12 text-center text-gray-500">Загрузка пользователя...</div>

    <div
      v-else-if="error"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div v-else-if="!user" class="py-12 text-center text-gray-500">Пользователь не найден</div>

    <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">
            {{ user?.name || 'Пользователь' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500">@{{ user?.username || user?.id }}</p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/users/${route.params.id}/edit`"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white shadow-sm transition hover:bg-indigo-700"
          >
            Редактировать
          </NuxtLink>
          <button
            class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              v-if="false"
              class="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>Удалить</span>
          </button>
        </div>
      </div>

      <div class="px-6 py-6">
        <div v-if="pending" class="text-gray-500">Загрузка...</div>
        <div
          v-else-if="error"
          class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ error }}
        </div>
        <div v-else-if="!user" class="text-gray-500">Пользователь не найдена.</div>
        <EntitiesUserOutputsDetails v-else :user />
      </div>
    </div>
  </div>
</template>
