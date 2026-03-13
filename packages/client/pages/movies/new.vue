<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Фильмы', to: '/movies' },
        { label: 'Добавление' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить фильм</h1>
          <p class="mt-1 text-sm text-gray-500">Заполните поля ниже, чтобы добавить новый фильм</p>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="flex gap-6">
          <UiPhotoUpload
            v-model="posterFile"
            v-model:preview="posterPreview"
            label="Постер"
            :error="errors.poster"
            size="lg"
            class="flex-shrink-0"
          />

          <div class="flex-1 grid grid-cols-1 gap-6">
            <IntegrationsTmdbMovieSearch
              v-model="tmdbMovie"
              v-model:manual-query="manualTitle"
              label="Название"
              :required="true"
              :error="errors.title"
              placeholder="например, Интерстеллар"
              id="title"
            />
            <p class="-mt-4 text-xs text-gray-500">
              Выберите из подсказок TMDB или введите название вручную
            </p>

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
              <UiSelect
                v-model="form.directorId"
                :options="directorOptions"
                label="Режиссёр"
                placeholder="Выберите режиссёра"
                class="flex-1"
              />
              <NuxtLink
                :to="`/movies/directors/new?redirectTo=${encodeURIComponent('/movies/new')}`"
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
            to="/movies"
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
            <span>{{ submitting ? 'Сохранение...' : 'Создать' }}</span>
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
import type { TmdbMovie } from '~/types/api'

// Конфигурация
const config = useRuntimeConfig()
const router = useRouter()

// Состояние
const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

// Файлы и превью
const posterFile = ref<File | null>(null)
const posterPreview = ref<string | null>(null)

// Загрузка данных
const { data: directors } = await useFetch<{ id: string; fullName: string }[]>(
  `${useRuntimeConfig().public.apiBase}/directors`,
)

// Вычисляемые свойства
const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Фильмы', to: '/movies' },
  { label: 'Добавление' },
])

const directorOptions = computed(() => [
  { value: '', label: 'Выберите режиссёра' },
  ...(directors.value || []).map((d) => ({ value: d.id, label: d.fullName })),
])

// Данные формы
const form = reactive({
  genre: '',
  directorId: '',
  watchedAt: new Date().toISOString().split('T')[0],
  rating: undefined as number | undefined,
  releaseYear: undefined as number | undefined,
  comment: '',
})

const tmdbMovie = ref<TmdbMovie | null>(null)
const manualTitle = ref('')

// Load form data from localStorage on mount
onMounted(() => {
  const savedData = localStorage.getItem('movieFormDraft')
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      form.genre = parsed.genre || ''
      form.directorId = parsed.directorId || ''
      form.watchedAt = parsed.watchedAt || new Date().toISOString().split('T')[0]
      form.rating = parsed.rating
      form.releaseYear = parsed.releaseYear
      form.comment = parsed.comment || ''
      manualTitle.value = parsed.manualTitle || ''

      // Restore TMDB movie data if available
      if (parsed.tmdbMovie) {
        tmdbMovie.value = parsed.tmdbMovie
      }

      // Restore poster preview if available
      if (parsed.posterPreview) {
        posterPreview.value = parsed.posterPreview
      }
    } catch (e) {
      console.error('Failed to parse saved form data:', e)
    }
  }
})

// Save form data to localStorage when it changes
watch(
  [form, manualTitle, tmdbMovie, posterPreview],
  () => {
    const dataToSave = {
      genre: form.genre,
      directorId: form.directorId,
      watchedAt: form.watchedAt,
      rating: form.rating,
      releaseYear: form.releaseYear,
      comment: form.comment,
      manualTitle: manualTitle,
      tmdbMovie: tmdbMovie,
      posterPreview: posterPreview,
    }
    localStorage.setItem('movieFormDraft', JSON.stringify(dataToSave))
  },
  { deep: true },
)

watch(tmdbMovie, async (newMovie) => {
  if (newMovie) {
    if (newMovie.release_date) {
      form.releaseYear = parseInt(newMovie.release_date.slice(0, 4), 10)
    }
    if (newMovie.poster_path) {
      const url = `https://image.tmdb.org/t/p/w500${newMovie.poster_path}`
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        posterFile.value = new File([blob], `${newMovie.id}.jpg`, { type: blob.type })
        posterPreview.value = url
      } catch (e) {
        console.error('Failed to fetch TMDB poster:', e)
      }
    }
    if (newMovie.genre_ids && newMovie.genre_ids.length > 0) {
      try {
        const response = await _fetch<{ genres: { id: number; name: string }[] }>(
          `https://api.themoviedb.org/3/genre/movie/list`,
          {
            params: {
              api_key: config.public.tmdbApiKey,
              language: 'ru-RU',
            },
          },
        )
        const genres = response.genres
        const movieGenres = newMovie.genre_ids
          .map((id) => genres.find((g) => g.id === id)?.name)
          .filter(Boolean)
        if (movieGenres.length > 0) {
          form.genre = movieGenres.join(', ')
        }
      } catch (e) {
        console.error('Failed to fetch TMDB genres:', e)
      }
    }
  }
})

const onSubmit = async () => {
  if (submitting.value) return

  try {
    submitting.value = true
    errors.value = {}
    error.value = ''

    const title = tmdbMovie.value?.title || manualTitle.value.trim()
    if (!title) {
      errors.value.title = 'Название обязательно'
      return
    }

    const formData = new FormData()
    formData.append('title', title)
    if (form.genre?.trim()) {
      formData.append('genre', form.genre.trim())
    }
    if (form.directorId) {
      formData.append('directorId', form.directorId)
    }
    if (typeof form.rating === 'number') {
      formData.append('rating', String(form.rating))
    }
    if (form.watchedAt) {
      formData.append('watchedAt', form.watchedAt)
    }
    if (form.comment?.trim()) {
      formData.append('comment', form.comment.trim())
    }
    if (typeof form.releaseYear === 'number') {
      formData.append('releaseYear', String(form.releaseYear))
    }
    if (posterFile.value) {
      formData.append('poster', posterFile.value)
    }

    await _fetch(`${config.public.apiBase}/movies`, {
      method: 'POST',
      body: formData,
    })

    // Clear localStorage after successful submission
    localStorage.removeItem('movieFormDraft')

    navigateTo('/movies')
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
    error.value = base ?? 'Произошла ошибка при создании фильма'
  } finally {
    submitting.value = false
  }
}
</script>
