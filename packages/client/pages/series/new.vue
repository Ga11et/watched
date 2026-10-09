<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Сериалы', to: '/series' },
        { label: 'Добавление' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить сериал</h1>
          <p class="mt-1 text-sm text-gray-500">Заполните поля ниже, чтобы добавить новый сериал</p>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="flex gap-6">
          <UiPhotoUpload
            v-model="posterFile"
            v-model:preview="posterPreview"
            label="Постер"
            :error="errors.poster"
            class="flex-shrink-0"
          />

          <div class="flex-1 grid grid-cols-1 gap-6">
            <IntegrationsTmdbSeriesSearch
              v-model="tmdbSeries"
              v-model:manual-query="manualTitle"
              label="Название"
              :required="true"
              :error="errors.title"
            />

            <div>
              <label for="genres" class="block text-sm font-medium text-gray-700"> Жанры </label>
              <input
                id="genres"
                v-model="form.genres"
                type="text"
                placeholder="Например: драма, комедия, боевик"
                :class="[
                  'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                  errors.genres
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
                ]"
              />
              <p v-if="errors.genres" class="mt-1 text-sm text-red-600">{{ errors.genres }}</p>
            </div>

            <div>
              <label for="country" class="block text-sm font-medium text-gray-700">
                Страна производства
              </label>
              <input
                id="country"
                v-model="form.country"
                type="text"
                :class="[
                  'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                  errors.country
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
                ]"
                placeholder="например, США"
              />
              <p v-if="errors.country" class="mt-1 text-sm text-red-600">{{ errors.country }}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="rating" class="block text-sm font-medium text-gray-700">
                  Рейтинг
                </label>
                <input
                  id="rating"
                  v-model.number="form.rating"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  :class="[
                    'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                    errors.rating
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
                  ]"
                  placeholder="0-100"
                />
                <p v-if="errors.rating" class="mt-1 text-sm text-red-600">{{ errors.rating }}</p>
              </div>

              <div>
                <label for="watchedAt" class="block text-sm font-medium text-gray-700">
                  Дата просмотра
                </label>
                <input
                  id="watchedAt"
                  v-model="form.watchedAt"
                  type="date"
                  :class="[
                    'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                    errors.watchedAt
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
                  ]"
                />
                <p v-if="errors.watchedAt" class="mt-1 text-sm text-red-600">
                  {{ errors.watchedAt }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="totalSeasons" class="block text-sm font-medium text-gray-700">
                  Всего сезонов
                </label>
                <input
                  id="totalSeasons"
                  v-model.number="form.totalSeasons"
                  type="number"
                  min="1"
                  :class="[
                    'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                    errors.totalSeasons
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
                  ]"
                  placeholder="0"
                />
                <p v-if="errors.totalSeasons" class="mt-1 text-sm text-red-600">
                  {{ errors.totalSeasons }}
                </p>
              </div>

              <div>
                <label for="watchedSeasons" class="block text-sm font-medium text-gray-700">
                  Просмотрено сезонов
                </label>
                <input
                  id="watchedSeasons"
                  v-model.number="form.watchedSeasons"
                  type="number"
                  min="0"
                  :class="[
                    'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                    errors.watchedSeasons
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
                  ]"
                  placeholder="0"
                />
                <p v-if="errors.watchedSeasons" class="mt-1 text-sm text-red-600">
                  {{ errors.watchedSeasons }}
                </p>
              </div>
            </div>

            <div>
              <label for="comment" class="block text-sm font-medium text-gray-700">
                Комментарий
              </label>
              <textarea
                id="comment"
                v-model="form.comment"
                rows="3"
                :class="[
                  'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                  errors.comment
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
                ]"
                placeholder="Ваши впечатления от сериала"
              ></textarea>
              <p v-if="errors.comment" class="mt-1 text-sm text-red-600">{{ errors.comment }}</p>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink
            to="/series"
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
import type { TmdbSeries } from '~/types/api'

const { request } = useApiRequest()
const config = useRuntimeConfig()
const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const today = new Date().toISOString().split('T')[0]

const tmdbSeries = ref<TmdbSeries | null>(null)
const manualTitle = ref('')
const posterFile = ref<File | null>(null)
const posterPreview = ref<string | null>(null)

interface SeriesForm {
  genres: string
  country: string
  rating: number
  totalSeasons: number
  watchedSeasons: number
  watchedAt: string
  comment: string
}

const form = ref<SeriesForm>({
  genres: '',
  country: '',
  rating: 0,
  totalSeasons: 0,
  watchedSeasons: 0,
  watchedAt: today,
  comment: '',
})

// Load form data from localStorage on mount
onMounted(() => {
  const savedData = localStorage.getItem('seriesFormDraft')
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      form.value = { ...form.value, ...parsed }
      if (parsed.posterPreview) {
        posterPreview.value = parsed.posterPreview
      }
    } catch (e) {
      console.error('Failed to load form draft:', e)
    }
  }
})

// Save form data to localStorage on change
watch(
  [form, posterPreview],
  () => {
    const dataToSave = {
      ...form.value,
      posterPreview: posterPreview.value,
    }
    localStorage.setItem('seriesFormDraft', JSON.stringify(dataToSave))
  },
  { deep: true },
)

// Update form when TMDB series is selected
watch(tmdbSeries, async (newSeries) => {
  if (newSeries) {
    form.value.country = newSeries.origin_country?.[0] || ''
    form.value.totalSeasons = newSeries.number_of_seasons || 0
    form.value.watchedSeasons = 0

    // Fetch genres from TMDB
    if (newSeries.genre_ids && newSeries.genre_ids.length > 0) {
      try {
        const response = await $fetch<{ genres: { id: number; name: string }[] }>(
          `https://api.themoviedb.org/3/genre/tv/list`,
          {
            params: {
              api_key: config.public.tmdbApiKey,
              language: 'ru-RU',
            },
          },
        )
        const genres = response.genres
        const seriesGenres = newSeries.genre_ids
          .map((id) => genres.find((g) => g.id === id)?.name)
          .filter(Boolean)
        if (seriesGenres.length > 0) {
          form.value.genres = seriesGenres.join(', ')
        } else {
          form.value.genres = ''
        }
      } catch (e) {
        console.error('Failed to fetch TMDB genres:', e)
        form.value.genres = ''
      }
    } else {
      form.value.genres = ''
    }
  }
})

// Update poster preview when TMDB series is selected
watch(tmdbSeries, async (newSeries) => {
  if (newSeries?.poster_path) {
    posterPreview.value = `https://image.tmdb.org/t/p/w500${newSeries.poster_path}`

    // Load poster file
    try {
      const url = `https://image.tmdb.org/t/p/w500${newSeries.poster_path}`
      const response = await fetch(url)
      const blob = await response.blob()
      posterFile.value = new File([blob], `${newSeries.id}.jpg`, { type: blob.type })
    } catch (e) {
      console.error('Failed to fetch TMDB poster:', e)
    }
  } else {
    posterPreview.value = null
    posterFile.value = null
  }
})

const onSubmit = async () => {
  if (submitting.value) return

  try {
    submitting.value = true
    errors.value = {}
    error.value = ''

    const title = tmdbSeries.value?.name || manualTitle.value.trim()
    if (!title) {
      errors.value.title = 'Название обязательно'
      return
    }

    if (form.value.totalSeasons && form.value.watchedSeasons > form.value.totalSeasons) {
      errors.value.watchedSeasons = 'Просмотренных сезонов не может быть больше общего количества'
      return
    }

    const formData = new FormData()
    formData.append('title', title)
    if (form.value.genres?.trim()) {
      formData.append('genres', form.value.genres.trim())
    }
    if (form.value.country?.trim()) {
      formData.append('country', form.value.country.trim())
    }
    if (form.value.rating) {
      formData.append('rating', form.value.rating.toString())
    }
    if (form.value.totalSeasons) {
      formData.append('totalSeasons', form.value.totalSeasons.toString())
    }
    if (form.value.watchedSeasons) {
      formData.append('watchedSeasons', form.value.watchedSeasons.toString())
    }
    if (form.value.watchedAt) {
      formData.append('watchedAt', form.value.watchedAt)
    }
    if (form.value.comment?.trim()) {
      formData.append('comment', form.value.comment.trim())
    }
    if (posterFile.value) {
      formData.append('poster', posterFile.value)
    }

    await request(`/series`, {
      method: 'POST',
      body: formData,
    })

    // Clear form draft
    localStorage.removeItem('seriesFormDraft')

    navigateTo('/series')
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
    error.value = base ?? 'Произошла ошибка при добавлении сериала'
  } finally {
    submitting.value = false
  }
}
</script>
