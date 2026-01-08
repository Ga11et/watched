<template>
  <div class="mx-auto max-w-7xl">
    <Breadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Фильмы', to: '/movies' },
        { label: movie?.title || 'Загрузка...', to: `/movies/${route.params.id}` },
        { label: 'Редактирование' },
      ]"
    />

    <div
      v-if="loadError"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ loadError }}
    </div>

    <div v-if="pending" class="text-center py-12 text-gray-500">Загрузка...</div>

    <div v-else class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать фильм</h1>
        <p class="mt-1 text-sm text-gray-500">Измените данные фильма</p>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="flex gap-6">
          <PhotoUpload
            v-model="posterFile"
            v-model:preview="posterPreview"
            label="Постер"
            :error="errors.poster"
            size="lg"
            class="flex-shrink-0"
          />

          <div class="flex-1 grid grid-cols-1 gap-6">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700">
                Название<span class="text-red-500">*</span>
              </label>
              <div class="flex gap-2">
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  :class="[
                    'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                    errors.title
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
                  ]"
                  placeholder="например, Интерстеллар"
                />
                <button
                  type="button"
                  @click="loadFromTmdb"
                  :disabled="loadingTmdb || !form.title.trim()"
                  class="mt-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <svg
                    v-if="loadingTmdb"
                    class="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  TMDB
                </button>
              </div>
              <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
              <p v-if="tmdbError" class="mt-1 text-sm text-red-600">{{ tmdbError }}</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="genre" class="block text-sm font-medium text-gray-700">Жанр</label>
                <input
                  id="genre"
                  v-model.trim="form.genre"
                  type="text"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="например, Фантастика"
                />
              </div>
              <div>
                <label for="releaseYear" class="block text-sm font-medium text-gray-700"
                  >Год выхода</label
                >
                <input
                  id="releaseYear"
                  v-model.number="form.releaseYear"
                  type="number"
                  min="1888"
                  :max="new Date().getFullYear() + 5"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="например, 2014"
                />
              </div>
            </div>

            <div class="flex gap-2">
              <CustomSelect
                v-model="form.directorId"
                :options="directorOptions"
                label="Режиссёр"
                placeholder="Выберите режиссёра"
                class="flex-1"
              />
              <NuxtLink
                :to="`/movies/directors/new?redirectTo=${encodeURIComponent(`/movies/${route.params.id}/edit`)}`"
                class="mt-7 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Новый
              </NuxtLink>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="rating" class="block text-sm font-medium text-gray-700"
                  >Оценка (0-100)</label
                >
                <input
                  id="rating"
                  v-model.number="form.rating"
                  type="number"
                  min="0"
                  max="100"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="например, 85"
                />
              </div>
              <div>
                <label for="watchedAt" class="block text-sm font-medium text-gray-700"
                  >Дата просмотра</label
                >
                <input
                  id="watchedAt"
                  v-model="form.watchedAt"
                  type="date"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div>
              <label for="comment" class="block text-sm font-medium text-gray-700"
                >Комментарий</label
              >
              <textarea
                id="comment"
                v-model="form.comment"
                rows="3"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Ваши впечатления от фильма"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink
            :to="`/movies/${route.params.id}`"
            class="rounded-lg px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Отмена
          </NuxtLink>
          <button
            type="submit"
            :disabled="submitting"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              v-if="submitting"
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
            <span>{{ submitting ? 'Сохранение...' : 'Сохранить' }}</span>
          </button>
        </div>

        <div
          v-if="error"
          class="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()

const loadError = ref('')
const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const loadingTmdb = ref(false)
const tmdbError = ref('')

interface MovieForm {
  title: string
  genre: string
  directorId: string
  watchedAt: string
  rating: number | undefined
  releaseYear: number | undefined
  comment: string
}

const form = ref<MovieForm>({
  title: '',
  genre: '',
  directorId: '',
  watchedAt: '',
  rating: undefined,
  releaseYear: undefined,
  comment: '',
})

const posterFile = ref<File | null>(null)
const posterPreview = ref<string | null>(null)

const directorOptions = computed(() => [
  { value: '', label: 'Выберите режиссёра' },
  ...(directors.value?.map((d) => ({ value: d.id, label: d.fullName })) || []),
])

const { data: directors } = await useAsyncData<{ id: string; fullName: string }[]>(
  'directors-list-edit',
  async () => {
    try {
      return await $fetch(`${config.public.apiBase}/directors`)
    } catch {
      return []
    }
  },
)

const { data: movie, pending } = await useAsyncData(
  `movie-edit-${route.params.id}`,
  async () => {
    try {
      loadError.value = ''
      const data = await $fetch<{
        id: string
        title: string
        genre?: string | null
        directorId?: string | null
        rating?: number | null
        watchedAt?: string | null
        comment?: string | null
        releaseYear?: number | null
        poster?: string | null
      }>(`${config.public.apiBase}/movies/${route.params.id}`)

      form.value.title = data.title || ''
      form.value.genre = data.genre || ''
      form.value.directorId = data.directorId || ''
      form.value.watchedAt = data.watchedAt ? String(data.watchedAt).slice(0, 10) : ''
      form.value.rating = typeof data.rating === 'number' ? data.rating : undefined
      form.value.releaseYear = typeof data.releaseYear === 'number' ? data.releaseYear : undefined
      form.value.comment = data.comment || ''
      if (data.poster) {
        posterPreview.value = `${config.public.apiBase}${data.poster}`
      }

      return data
    } catch (e: any) {
      loadError.value = e?.data?.message || 'Не удалось загрузить фильм'
      return null
    }
  },
  { server: false },
)

interface TmdbMovie {
  id: number
  title: string
  release_date?: string
  genre_ids?: number[]
  poster_path?: string
}

interface TmdbSearchResponse {
  results: TmdbMovie[]
}

interface TmdbGenre {
  id: number
  name: string
}

interface TmdbGenresResponse {
  genres: TmdbGenre[]
}

const loadFromTmdb = async () => {
  if (!form.value.title.trim()) return

  loadingTmdb.value = true
  tmdbError.value = ''

  try {
    const response = await $fetch<TmdbSearchResponse>(`https://api.themoviedb.org/3/search/movie`, {
      params: {
        api_key: config.public.tmdbApiKey,
        query: form.value.title.trim(),
        language: 'ru-RU',
      },
    })

    if (response.results && response.results.length > 0) {
      const movie = response.results[0]

      // Update form with TMDB data
      form.value.title = movie.title
      if (movie.release_date) {
        form.value.releaseYear = parseInt(movie.release_date.slice(0, 4), 10)
      }
      if (movie.genre_ids && movie.genre_ids.length > 0) {
        try {
          const genresResponse = await $fetch<TmdbGenresResponse>(
            `https://api.themoviedb.org/3/genre/movie/list`,
            {
              params: {
                api_key: config.public.tmdbApiKey,
                language: 'ru-RU',
              },
            },
          )
          const genres = genresResponse.genres
          const movieGenres = movie.genre_ids
            .map((id) => genres.find((g) => g.id === id)?.name)
            .filter(Boolean)
          if (movieGenres.length > 0) {
            form.value.genre = movieGenres.join(', ')
          }
        } catch (e) {
          console.error('Failed to fetch TMDB genres:', e)
        }
      }
      if (movie.poster_path) {
        const url = `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          posterFile.value = new File([blob], `${movie.id}.jpg`, { type: blob.type })
          posterPreview.value = url
        } catch (e) {
          console.error('Failed to fetch TMDB poster:', e)
        }
      }
    } else {
      tmdbError.value = 'Фильм не найден в TMDB'
    }
  } catch (e) {
    console.error('TMDB search error:', e)
    tmdbError.value = 'Ошибка при поиске в TMDB'
  } finally {
    loadingTmdb.value = false
  }
}

const onSubmit = async () => {
  if (submitting.value) return

  try {
    submitting.value = true
    errors.value = {}
    error.value = ''

    const title = form.value.title.trim()
    if (!title) {
      errors.value.title = 'Название обязательно'
      return
    }

    const formData = new FormData()
    formData.append('title', title)
    if (form.value.genre?.trim()) {
      formData.append('genre', form.value.genre.trim())
    }
    if (form.value.directorId) {
      formData.append('directorId', form.value.directorId)
    }
    if (typeof form.value.rating === 'number') {
      formData.append('rating', String(form.value.rating))
    }
    if (form.value.watchedAt) {
      formData.append('watchedAt', form.value.watchedAt)
    }
    if (form.value.comment?.trim()) {
      formData.append('comment', form.value.comment.trim())
    }
    if (typeof form.value.releaseYear === 'number') {
      formData.append('releaseYear', String(form.value.releaseYear))
    }
    if (posterFile.value) {
      formData.append('poster', posterFile.value)
    } else if (movie.value?.poster && !posterPreview.value) {
      formData.append('removePoster', 'true')
    }

    await $fetch(`${config.public.apiBase}/movies/${route.params.id}`, {
      method: 'PUT',
      body: formData,
    })

    navigateTo(`/movies/${route.params.id}`)
  } catch (e) {
    const err = e as {
      data?: { message?: string; violations?: Array<{ field: string; message: string }> }
    }
    const base = err.data?.message
    const violations = err.data?.violations

    if (Array.isArray(violations) && violations.length) {
      violations.forEach((v) => {
        errors.value[v.field] = v.message
      })
    }
    error.value = base ?? 'Произошла ошибка при обновлении фильма'
  } finally {
    submitting.value = false
  }
}
</script>
