<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Игры', to: '/games' },
        { label: 'Разработчики', to: '/games/developers' },
        { label: developer?.fullName || 'Загрузка...' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">
            {{ developer?.fullName || 'Разработчик' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500" v-if="developer">Детали разработчика</p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/games/developers/${route.params.id}/edit`"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white shadow-sm transition hover:bg-indigo-700"
          >
            Редактировать
          </NuxtLink>
          <button
            @click="onDelete"
            :disabled="deleting"
            class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              v-if="deleting"
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
        <div v-else-if="!developer" class="text-gray-500">Разработчик не найден.</div>
        <EntitiesGamesOutputsDevelopersDetails v-else :developer="developer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const error = ref('')
const deleting = ref(false)

interface Developer {
  id: string
  fullName: string
  comment?: string | null
  photo?: string | null
  createdAt: string
  updatedAt: string
}

const { data: developer, pending } = await useAsyncData(
  `developer-${route.params.id}`,
  async () => {
    return await $fetch<Developer>(
      `${useRuntimeConfig().public.apiBase}/developers/${route.params.id}`,
    )
  },
)

const onDelete = async () => {
  if (!developer.value) return
  if (!confirm('Удалить этого разработчика? Это действие нельзя отменить.')) return
  deleting.value = true
  try {
    await $fetch(`${useRuntimeConfig().public.apiBase}/developers/${route.params.id}`, {
      method: 'DELETE',
    })
    router.push('/games/developers')
  } catch (e: any) {
    error.value = e?.data?.message || 'Не удалось удалить разработчика'
  } finally {
    deleting.value = false
  }
}
</script>
