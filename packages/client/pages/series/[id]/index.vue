<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Сериалы', to: '/series' },
        { label: series?.title || 'Загрузка...' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
      <div class="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">
            {{ series?.title || 'Сериал' }}
          </h1>
          <p v-if="series" class="mt-1 text-sm text-gray-500">Детали сериала</p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/series/${route.params.id}/edit`"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white shadow-sm transition hover:bg-indigo-700"
          >
            Редактировать
          </NuxtLink>
          <button
            :disabled="deleting"
            class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            @click="onDelete"
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
        <div v-else-if="!series" class="text-gray-500">Сериал не найден.</div>
        <EntitiesSeriesOutputsDetails v-else :series="series" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { get, remove } = useSeries()
const error = ref('')
const deleting = ref(false)

const { data: series, pending } = await useAsyncData(`series-${route.params.id}`, async () => {
  try {
    error.value = ''
    return await get(String(route.params.id))
  } catch (e: unknown) {
    error.value = parseRequestError(e).message
    return null
  }
})

const onDelete = async () => {
  if (!series.value) return
  if (!confirm('Удалить этот сериал? Это действие нельзя отменить.')) return
  deleting.value = true
  try {
    await remove(String(route.params.id))
    router.push('/series')
  } catch (e: unknown) {
    error.value = parseRequestError(e).message
  } finally {
    deleting.value = false
  }
}
</script>
