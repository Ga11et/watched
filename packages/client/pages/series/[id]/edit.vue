<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Сериалы', to: '/series' },
        { label: series?.title || 'Загрузка...', to: `/series/${route.params.id}` },
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

    <div v-else class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать сериал</h1>
        <p class="mt-1 text-sm text-gray-500">Измените данные сериала</p>
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
                  placeholder="например, Во все тяжкие"
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
            :to="`/series/${route.params.id}`"
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

const form = ref({
  title: '',
  genres: '' as string,
  country: '',
  rating: 0,
  totalSeasons: 0,
  watchedSeasons: 0,
  watchedAt: '',
  comment: '',
})

const posterFile = ref<File | null>(null)
const posterPreview = ref<string | null>(null)

const { data: series, pending } = await useAsyncData(
  `series-edit-${route.params.id}`,
  async () => {
    try {
      loadError.value = ''
      const data = await $fetch<{
        id: string
        title: string
        genres?: string | null
        country?: string | null
        rating?: number | null
        totalSeasons?: number | null
        watchedSeasons?: number | null
        watchedAt?: string | null
        comment?: string | null
        poster?: string | null
      }>(`${config.public.apiBase}/series/${route.params.id}`)

      form.value.title = data.title || ''
      form.value.genres = data.genres || ''
      form.value.country = data.country || ''
      form.value.rating = data.rating || 0
      form.value.totalSeasons = data.totalSeasons || 0
      form.value.watchedSeasons = data.watchedSeasons || 0
      form.value.watchedAt = data.watchedAt ? String(data.watchedAt).slice(0, 10) : ''
      form.value.comment = data.comment || ''

      if (data.poster) {
        posterPreview.value = `${config.public.apiBase}${data.poster}`
      }

      return data
    } catch (e: any) {
      loadError.value = e?.data?.message || 'Не удалось загрузить сериал'
      return null
    }
  },
  { server: false },
)

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
    } else if (series.value?.poster && !posterPreview.value) {
      // Если было фото и превью убрали - значит надо удалить фото
      formData.append('removePoster', 'true')
    }

    await $fetch(`${config.public.apiBase}/series/${route.params.id}`, {
      method: 'PUT',
      body: formData,
    })

    navigateTo(`/series/${route.params.id}`)
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
    error.value = base ?? 'Произошла ошибка при обновлении сериала'
  } finally {
    submitting.value = false
  }
}

interface TmdbSeries {
  id: number
  name: string
  origin_country: string[]
  genre_ids: number[]
  number_of_seasons: number
  poster_path?: string
}

interface TmdbSearchResponse {
  results: TmdbSeries[]
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
    const response = await $fetch<TmdbSearchResponse>(`https://api.themoviedb.org/3/search/tv`, {
      params: {
        api_key: config.public.tmdbApiKey,
        query: form.value.title.trim(),
        language: 'ru-RU',
      },
    })

    if (response.results && response.results.length > 0) {
      const series = response.results[0]

      // Update form with TMDB data
      form.value.title = series.name
      form.value.country = series.origin_country?.[0] || ''
      form.value.totalSeasons = series.number_of_seasons || 0

      // Fetch genres from TMDB
      if (series.genre_ids && series.genre_ids.length > 0) {
        try {
          const genresResponse = await $fetch<TmdbGenresResponse>(
            `https://api.themoviedb.org/3/genre/tv/list`,
            {
              params: {
                api_key: config.public.tmdbApiKey,
                language: 'ru-RU',
              },
            },
          )
          const genres = genresResponse.genres
          const seriesGenres = series.genre_ids
            .map((id) => genres.find((g) => g.id === id)?.name)
            .filter(Boolean)
          if (seriesGenres.length > 0) {
            form.value.genres = seriesGenres.join(', ')
          }
        } catch (e) {
          console.error('Failed to fetch TMDB genres:', e)
        }
      }

      if (series.poster_path) {
        const url = `https://image.tmdb.org/t/p/w500${series.poster_path}`
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          posterFile.value = new File([blob], `${series.id}.jpg`, { type: blob.type })
          posterPreview.value = url
        } catch (e) {
          console.error('Failed to fetch TMDB poster:', e)
        }
      }
    } else {
      tmdbError.value = 'Сериал не найден в TMDB'
    }
  } catch (e) {
    console.error('TMDB search error:', e)
    tmdbError.value = 'Ошибка при поиске в TMDB'
  } finally {
    loadingTmdb.value = false
  }
}
</script>
