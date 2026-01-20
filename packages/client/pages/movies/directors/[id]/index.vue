<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Фильмы', to: '/movies' },
        { label: 'Режиссёры', to: '/movies/directors' },
        { label: director?.fullName || 'Загрузка...' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">
            {{ director?.fullName || 'Режиссёр' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500" v-if="director">Детали режиссёра</p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/movies/directors/${route.params.id}/edit`"
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
        <div v-else-if="!director" class="text-gray-500">Режиссёр не найден.</div>
        <div v-else class="flex gap-6">
          <div class="flex-shrink-0">
            <div v-if="director.photo" class="w-32 h-40 rounded-lg overflow-hidden">
              <img
                :src="`${config.public.apiBase}${director.photo}`"
                :alt="director.fullName"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="w-32 h-40 rounded-lg bg-gray-100 flex items-center justify-center">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          <div class="flex-1 space-y-4">
            <div>
              <div class="text-sm text-gray-500">ФИО</div>
              <div class="text-base text-gray-900 font-medium">{{ director.fullName }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Комментарий</div>
              <div class="text-base text-gray-900 whitespace-pre-line">
                {{ director.comment || '—' }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <div class="tracking-wide">Создано</div>
                <div class="text-gray-900 m-0"><UiDateDisplay :date="director.createdAt" /></div>
              </div>
              <div>
                <div class="tracking-wide">Обновлено</div>
                <div class="text-gray-900 m-0"><UiDateDisplay :date="director.updatedAt" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template v-if="director && !pending">
      <div class="flex justify-between items-center mb-6 mt-8">
        <h2 class="text-xl font-semibold">Фильмы режиссёра</h2>
        <NuxtLink
          to="/movies/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Добавить фильм
        </NuxtLink>
      </div>

      <div v-if="!directorMovies?.length" class="text-center py-12 text-gray-500">
        Фильмов этого режиссёра пока нет.
      </div>
      <EntitiesMoviesTableView v-else :movies="directorMovies" />
    </template>
  </div>
</template>

<script setup>
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const error = ref('')
const deleting = ref(false)

const { data: director, pending } = await useAsyncData(`director-${route.params.id}`, async () => {
  try {
    error.value = ''
    return await $fetch(`${config.public.apiBase}/directors/${route.params.id}`)
  } catch (e) {
    error.value = e?.data?.message || 'Не удалось загрузить режиссёра'
    return null
  }
})

const { data: directorMovies } = await useAsyncData(
  `director-movies-${route.params.id}`,
  async () => {
    try {
      return await $fetch(`${config.public.apiBase}/movies`, {
        params: { directorId: route.params.id },
      })
    } catch {
      return []
    }
  },
)

const onDelete = async () => {
  if (!director.value) return
  if (!confirm('Удалить этого режиссёра? Это действие нельзя отменить.')) return
  deleting.value = true
  try {
    await $fetch(`${config.public.apiBase}/directors/${route.params.id}`, { method: 'DELETE' })
    router.push('/movies/directors')
  } catch (e) {
    error.value = e?.data?.message || 'Не удалось удалить режиссёра'
  } finally {
    deleting.value = false
  }
}
</script>
