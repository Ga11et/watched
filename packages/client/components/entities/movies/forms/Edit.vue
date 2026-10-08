<template>
  <form class="px-6 py-6" @submit.prevent="onSubmit">
    <div v-if="loading" class="text-center py-6 text-gray-500">Загрузка...</div>
    <div
      v-else-if="loadError"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ loadError }}
    </div>

    <div v-else-if="movie" class="space-y-6">
      <div class="flex gap-6">
        <UiPhotoUpload
          v-model="posterFile"
          v-model:preview="posterPreview"
          label="Постер"
          :error="errors.poster"
          size="lg"
          class="flex-shrink-0"
        />

        <CommonFormsConfigurableFields :config="formLayout" class="flex-1">
          <template #title>
            <EntitiesMoviesInputsTitle
              v-model="form.title"
              :error="errors.title"
              :disabled="isFormDisabled"
              :loading-tmdb="loadingTmdb"
              :tmdb-error="tmdbError"
              @load-tmdb="loadFromTmdb"
            />
          </template>

          <template #genre>
            <EntitiesMoviesInputsGenre
              v-model.trim="form.genre"
              :error="errors.genre"
              :disabled="isFormDisabled"
            />
          </template>

          <template #releaseYear>
            <EntitiesMoviesInputsReleaseYear
              v-model="form.releaseYear"
              :error="errors.releaseYear"
              :disabled="isFormDisabled"
            />
          </template>

          <template #directors>
            <EntitiesMoviesInputsDirectors
              v-model="form.directorIds"
              :error="errors.directorIds"
              :disabled="isFormDisabled"
            />
            <p
              v-if="movie.directors.length && !form.directorIds.length"
              class="mt-2 text-sm text-amber-700"
              role="status"
            >
              Снятие всех режиссёров пока не поддерживается: при сохранении прежние связи останутся.
              Можно заменить список или удалить отдельных режиссёров, оставив хотя бы одного.
            </p>
          </template>
        </CommonFormsConfigurableFields>
      </div>

      <div
        v-if="error"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <div class="flex items-center justify-end gap-3">
        <NuxtLink
          :to="`/movies/${movieId}`"
          class="rounded-lg px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Отмена
        </NuxtLink>
        <button
          type="submit"
          :disabled="isFormDisabled"
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
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span>{{ submitting ? 'Сохранение...' : 'Сохранить' }}</span>
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Movie } from '~/types/api'

const props = defineProps<{ movieId: string }>()
const emit = defineEmits<{ 'title-loaded': [title: string] }>()
const config = useRuntimeConfig()
const router = useRouter()

const loadError = ref('')
const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const loadingTmdb = ref(false)
const tmdbError = ref('')

interface MovieForm {
  title: string
  genre: string
  directorIds: string[]
  releaseYear: number | undefined
}

const form = ref<MovieForm>({
  title: '',
  genre: '',
  directorIds: [],
  releaseYear: undefined,
})

const posterFile = ref<File | null>(null)
const posterPreview = ref<string | null>(null)
const formLayout = [
  { columns: 1, fields: [{ id: 'title' }] },
  { columns: 2, fields: [{ id: 'genre' }, { id: 'releaseYear' }] },
  { columns: 1, fields: [{ id: 'directors' }] },
]

const { data: movie, pending: loading } = useAsyncData(
  `movie-edit-${props.movieId}`,
  async () => {
    try {
      loadError.value = ''
      return await _fetch<Movie>(`${config.public.apiBase}/movies/${props.movieId}`)
    } catch (e) {
      const err = e as { data?: { message?: string } }
      loadError.value = err.data?.message || 'Не удалось загрузить фильм'
      return null
    }
  },
  { server: false },
)

watch(
  movie,
  (data) => {
    if (!data) return
    emit('title-loaded', data.title)
    form.value.title = data.title || ''
    form.value.genre = data.genre || ''
    form.value.directorIds = data.directors.map((director) => director.id)
    form.value.releaseYear = typeof data.releaseYear === 'number' ? data.releaseYear : undefined
    posterPreview.value = data.poster ? `${config.public.apiBase}${data.poster}` : null
  },
  { immediate: true },
)

const isFormDisabled = computed(() => loading.value || submitting.value)

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
  if (isFormDisabled.value || loadingTmdb.value || !form.value.title.trim()) return

  loadingTmdb.value = true
  tmdbError.value = ''

  try {
    const response = await _fetch<TmdbSearchResponse>(`https://api.themoviedb.org/3/search/movie`, {
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
          const genresResponse = await _fetch<TmdbGenresResponse>(
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
  if (isFormDisabled.value || !movie.value || loadError.value) return

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
    for (const directorId of form.value.directorIds) {
      formData.append('directorIds[]', directorId)
    }
    if (typeof form.value.releaseYear === 'number') {
      formData.append('releaseYear', String(form.value.releaseYear))
    }
    if (posterFile.value) {
      formData.append('poster', posterFile.value)
    } else if (movie.value?.poster && !posterPreview.value) {
      formData.append('removePoster', 'true')
    }

    await _fetch(`${config.public.apiBase}/movies/${props.movieId}`, {
      method: 'PUT',
      body: formData,
    })

    await router.push(`/movies/${props.movieId}`)
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
