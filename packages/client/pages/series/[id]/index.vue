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
          <p class="mt-1 text-sm text-gray-500" v-if="series">Детали сериала</p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/series/${route.params.id}/edit`"
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
        <div v-else-if="!series" class="text-gray-500">Сериал не найден.</div>
        <div v-else class="flex gap-6">
          <div class="flex-shrink-0">
            <div v-if="series.poster" class="w-40 h-56 rounded-lg overflow-hidden">
              <img
                :src="`${config.public.apiBase}${series.poster}`"
                :alt="series.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="w-40 h-56 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>
            </div>
          </div>
          <div class="flex-1 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="space-y-4">
              <div>
                <div class="text-sm text-gray-500">Название</div>
                <div class="text-base text-gray-900 font-medium">{{ series.title }}</div>
              </div>
              <div v-if="series.genres">
                <div class="text-sm text-gray-500">Жанры</div>
                <div class="text-base text-gray-900">{{ series.genres }}</div>
              </div>
              <div v-if="series.country">
                <div class="text-sm text-gray-500">Страна производства</div>
                <div class="text-base text-gray-900">{{ series.country }}</div>
              </div>
            </div>
            <div class="space-y-4">
              <div v-if="series.rating">
                <div class="text-sm text-gray-500">Рейтинг</div>
                <div class="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                  <span class="text-base text-gray-900">{{ Math.round(series.rating) }}/100</span>
                </div>
              </div>
              <div v-if="series.watchedAt">
                <div class="text-sm text-gray-500">Дата просмотра</div>
                <div class="text-gray-900 m-0"><UiDateDisplay :date="series.watchedAt" /></div>
              </div>
              <div v-if="series.totalSeasons">
                <div class="text-sm text-gray-500">Просмотрено сезонов</div>
                <div class="text-base text-gray-900">
                  {{ series.watchedSeasons || 0 }} из {{ series.totalSeasons }}
                </div>
              </div>
            </div>
            <div class="col-span-2">
              <EntitiesCommonCommentBlock :comment="series.comment" />
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <div class="tracking-wide">Создано</div>
                <div class="text-gray-900 m-0"><UiDateDisplay :date="series.createdAt" /></div>
              </div>
              <div>
                <div class="tracking-wide">Обновлено</div>
                <div class="text-gray-900 m-0"><UiDateDisplay :date="series.updatedAt" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()
const { request } = useApiRequest()
const config = useRuntimeConfig()
const error = ref('')
const deleting = ref(false)

const { data: series, pending } = await useAsyncData(`series-${route.params.id}`, async () => {
  try {
    error.value = ''
    return await request(`/series/${route.params.id}`)
  } catch (e) {
    error.value = e?.data?.message || 'Не удалось загрузить сериал'
    return null
  }
})

const onDelete = async () => {
  if (!series.value) return
  if (!confirm('Удалить этот сериал? Это действие нельзя отменить.')) return
  deleting.value = true
  try {
    await request(`/series/${route.params.id}`, { method: 'DELETE' })
    router.push('/series')
  } catch (e) {
    error.value = e?.data?.message || 'Не удалось удалить сериал'
  } finally {
    deleting.value = false
  }
}
</script>
