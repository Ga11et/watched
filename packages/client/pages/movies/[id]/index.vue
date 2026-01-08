<template>
  <div class="mx-auto max-w-7xl">
    <Breadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Фильмы', to: '/movies' },
        { label: movie?.title || 'Загрузка...' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">
            {{ movie?.title || 'Фильм' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500" v-if="movie">Детали фильма</p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/movies/${route.params.id}/edit`"
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
        <div v-else-if="!movie" class="text-gray-500">Фильм не найден.</div>
        <div v-else class="flex gap-6">
          <div class="flex-shrink-0">
            <div v-if="movie.poster" class="w-40 h-56 rounded-lg overflow-hidden">
              <img
                :src="`${config.public.apiBase}${movie.poster}`"
                :alt="movie.title"
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
                <div class="text-base text-gray-900 font-medium">{{ movie.title }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Жанр</div>
                <div class="text-base text-gray-900">{{ movie.genre || '—' }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Режиссёр</div>
                <div class="text-base text-gray-900">
                  <NuxtLink
                    v-if="director"
                    :to="`/movies/directors/${director.id}`"
                    class="text-indigo-600 hover:text-indigo-900"
                  >
                    {{ director.fullName }}
                  </NuxtLink>
                  <span v-else>—</span>
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Год выхода</div>
                <div class="text-base text-gray-900">{{ movie.releaseYear || '—' }}</div>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <div class="text-sm text-gray-500">Рейтинг</div>
                <div class="text-base text-gray-900">
                  {{ movie.rating != null ? `${movie.rating}/100` : '—' }}
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Дата просмотра</div>
                <div class="text-gray-900 m-0">
                  <DateDisplay v-if="movie.watchedAt" :date="movie.watchedAt" />
                  <span v-else>—</span>
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Комментарий</div>
                <div class="text-base text-gray-900 whitespace-pre-line">
                  {{ movie.comment || '—' }}
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <div class="tracking-wide">Создано</div>
                  <div class="text-gray-900 m-0"><DateDisplay :date="movie.createdAt" /></div>
                </div>
                <div>
                  <div class="tracking-wide">Обновлено</div>
                  <div class="text-gray-900 m-0"><DateDisplay :date="movie.updatedAt" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const error = ref('')
const deleting = ref(false)

interface Movie {
  id: string
  title: string
  genre?: string | null
  poster?: string | null
  watchedAt?: string | null
  comment?: string | null
  rating?: number | null
  releaseYear?: number | null
  directorId?: string | null
  createdAt: string
  updatedAt: string
}

interface Director {
  id: string
  fullName: string
}

const { data: movie, pending } = await useAsyncData(`movie-${route.params.id}`, async () => {
  error.value = ''
  return $fetch<Movie>(`${config.public.apiBase}/movies/${route.params.id}`).catch((e) => {
    error.value = e?.data?.message || 'Не удалось загрузить фильм'
    return null
  })
})

const { data: director } = await useAsyncData(
  `movie-director-${route.params.id}`,
  async () => {
    if (!movie.value?.directorId) return null
    return $fetch<Director>(`${config.public.apiBase}/directors/${movie.value.directorId}`).catch(
      () => null,
    )
  },
  { watch: [movie] },
)

const onDelete = async () => {
  if (!movie.value) return
  if (!confirm('Удалить этот фильм? Это действие нельзя отменить.')) return
  deleting.value = true
  try {
    await $fetch(`${config.public.apiBase}/movies/${route.params.id}`, { method: 'DELETE' })
    router.push('/movies')
  } catch (e: any) {
    error.value = e?.data?.message || 'Не удалось удалить фильм'
  } finally {
    deleting.value = false
  }
}
</script>
