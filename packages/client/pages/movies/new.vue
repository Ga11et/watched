<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs :items="breadcrumbItems" />

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

            <EntitiesMoviesInputsDirectors
              v-model="form.directorIds"
              :error="errors.directorIds"
              :disabled="submitting"
            />
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
            :disabled="submitting || restoringPoster"
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

// Состояние
const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

// Файлы и превью
const posterFile = ref<File | null>(null)
const posterPreview = ref<string | null>(null)
const restoringPoster = ref(false)

// Вычисляемые свойства
const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Фильмы', to: '/movies' },
  { label: 'Добавление' },
])

// Данные формы
const form = reactive<{ genre: string; directorIds: string[]; releaseYear?: number }>({
  genre: '',
  directorIds: [],
  releaseYear: undefined,
})

const tmdbMovie = ref<TmdbMovie | null>(null)
const manualTitle = ref('')
const draftLoaded = ref(false)
const draftCleared = ref(false)
let restoredTmdbMovie: TmdbMovie | null = null

// Загрузка данных
// Load form data from localStorage on mount
onMounted(() => {
  const savedData = localStorage.getItem('movieFormDraft')
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      form.genre = parsed.genre || ''
      form.directorIds = Array.isArray(parsed.directorIds)
        ? parsed.directorIds
        : parsed.directorId
          ? [parsed.directorId]
          : []
      form.releaseYear = parsed.releaseYear
      manualTitle.value = parsed.manualTitle || ''

      // Restore TMDB movie data if available
      if (parsed.tmdbMovie) {
        tmdbMovie.value = parsed.tmdbMovie
        restoredTmdbMovie = tmdbMovie.value
      }

      // Restore poster preview if available
      if (parsed.posterPreview) {
        posterPreview.value = parsed.posterPreview
      }
    } catch (e) {
      console.error('Failed to parse saved form data:', e)
    }
  }
  draftLoaded.value = true
})

watch(posterFile, (file) => {
  if (!file || !posterPreview.value?.startsWith('blob:')) return

  const preview = posterPreview.value
  const reader = new FileReader()
  reader.onload = () => {
    if (posterFile.value === file && posterPreview.value === preview) {
      posterPreview.value = String(reader.result)
      URL.revokeObjectURL(preview)
    }
  }
  reader.readAsDataURL(file)
})

watch(posterPreview, async (preview) => {
  restoringPoster.value = false
  delete errors.value.poster
  if (!preview || posterFile.value) return

  restoringPoster.value = true
  try {
    const response = await fetch(preview)
    if (!response.ok) throw new Error('Failed to fetch saved poster')
    const blob = await response.blob()
    if (posterPreview.value === preview && !posterFile.value) {
      posterFile.value = new File([blob], 'poster', { type: blob.type })
    }
  } catch (e) {
    console.error('Failed to restore poster:', e)
    if (posterPreview.value === preview) {
      errors.value.poster = 'Не удалось восстановить постер. Загрузите его повторно.'
    }
  } finally {
    if (posterPreview.value === preview) restoringPoster.value = false
  }
})

// Save form data to localStorage when it changes
watch(
  [form, manualTitle, tmdbMovie, posterPreview, draftLoaded],
  () => {
    if (!draftLoaded.value || draftCleared.value) return

    const dataToSave = {
      genre: form.genre,
      directorIds: form.directorIds,
      releaseYear: form.releaseYear,
      manualTitle: manualTitle.value,
      tmdbMovie: tmdbMovie.value,
      posterPreview: posterPreview.value,
    }
    try {
      localStorage.setItem('movieFormDraft', JSON.stringify(dataToSave))
    } catch (e) {
      console.error('Failed to save form draft:', e)
    }
  },
  { deep: true },
)

watch(tmdbMovie, async (newMovie) => {
  if (newMovie === restoredTmdbMovie) return

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
  if (submitting.value || restoringPoster.value) return

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
    for (const directorId of form.directorIds) {
      formData.append('directorIds[]', directorId)
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
    draftCleared.value = true
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
