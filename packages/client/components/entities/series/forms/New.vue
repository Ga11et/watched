<template>
  <form class="px-6 py-6" @submit.prevent="onSubmit">
    <div class="flex gap-6">
      <UiPhotoUpload
        v-model="posterFile"
        v-model:preview="posterPreview"
        label="Постер"
        :error="errors.poster"
        class="flex-shrink-0"
      />

      <CommonFormsConfigurableFields :config="seriesFormLayout" class="flex-1">
        <template #title>
          <EntitiesSeriesInputsTitle
            v-model="form.title"
            :error="errors.title"
            :disabled="submitting"
            @select="onSeriesSelect"
          />
        </template>

        <template #genres>
          <EntitiesSeriesInputsGenres
            v-model="form.genres"
            :error="errors.genres"
            :disabled="submitting"
          />
        </template>

        <template #country>
          <EntitiesSeriesInputsCountry
            v-model="form.country"
            :error="errors.country"
            :disabled="submitting"
          />
        </template>

        <template #rating>
          <EntitiesSeriesInputsRating
            v-model="form.rating"
            :error="errors.rating"
            :disabled="submitting"
          />
        </template>

        <template #watchedAt>
          <EntitiesSeriesInputsWatchedAt
            v-model="form.watchedAt"
            :error="errors.watchedAt"
            :disabled="submitting"
          />
        </template>

        <template #totalSeasons>
          <EntitiesSeriesInputsTotalSeasons
            v-model="form.totalSeasons"
            :error="errors.totalSeasons"
            :disabled="submitting"
          />
        </template>

        <template #watchedSeasons>
          <EntitiesSeriesInputsWatchedSeasons
            v-model="form.watchedSeasons"
            :error="errors.watchedSeasons"
            :disabled="submitting"
          />
        </template>

        <template #comment>
          <EntitiesSeriesInputsComment
            v-model="form.comment"
            :error="errors.comment"
            :disabled="submitting"
          />
        </template>
      </CommonFormsConfigurableFields>
    </div>

    <div
      v-if="error"
      class="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
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
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span>{{ submitting ? 'Сохранение...' : 'Сохранить' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import TmdbSeriesService from '~/components/integrations/tmdb-series.service'
import type { TmdbSeries } from '~/types/api'

const { create } = useSeries()
const tmdbSeriesService = new TmdbSeriesService(useRuntimeConfig().public.tmdbApiKey)

const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

const posterFile = ref<File | null>(null)
const posterPreview = ref<string | null>(null)
let selectedSeries: TmdbSeries | null = null

const form = reactive({
  title: '',
  genres: '',
  country: '',
  rating: undefined as number | undefined,
  watchedAt: new Date().toISOString().slice(0, 10),
  totalSeasons: undefined as number | undefined,
  watchedSeasons: undefined as number | undefined,
  comment: '',
})

const seriesFormLayout = [
  { columns: 1, fields: [{ id: 'title' }] },
  { columns: 1, fields: [{ id: 'genres' }] },
  { columns: 1, fields: [{ id: 'country' }] },
  { columns: 2, fields: [{ id: 'rating' }, { id: 'watchedAt' }] },
  { columns: 2, fields: [{ id: 'totalSeasons' }, { id: 'watchedSeasons' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
]

const onSeriesSelect = async (series: TmdbSeries) => {
  selectedSeries = series
  form.watchedSeasons = undefined

  const data = await tmdbSeriesService.getFormData(series)
  if (selectedSeries !== series) return

  form.country = data.country
  form.totalSeasons = data.totalSeasons || undefined
  form.genres = data.genres
  posterFile.value = data.posterFile
  posterPreview.value = data.posterPreview
}

const onSubmit = async () => {
  if (submitting.value) return

  error.value = ''
  const values = { ...form, poster: posterFile.value }
  errors.value = validateSeriesForm(values)
  if (Object.keys(errors.value).length > 0) return

  submitting.value = true
  try {
    await create(buildSeriesFormData(values))
    await navigateTo('/series')
  } catch (e: unknown) {
    const { message, violations } = parseRequestError(e)
    errors.value = violations
    error.value = message
  } finally {
    submitting.value = false
  }
}
</script>
