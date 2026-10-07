<template>
  <form novalidate class="px-6 py-6" @submit.prevent="onSubmit">
    <div v-if="loading" role="status" class="py-6 text-center text-gray-500">Загрузка...</div>
    <div
      v-else-if="loadError"
      role="alert"
      class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      Не удалось загрузить запись фильма.
      <button type="button" class="underline" @click="refresh()">Попробовать снова</button>
    </div>
    <div v-else-if="!userMovie" class="text-gray-500">Запись фильма не найдена.</div>

    <div v-else class="space-y-6">
      <div class="flex flex-col gap-6 sm:flex-row">
        <EntitiesMoviesOutputsPoster
          :poster="userMovie.movie.poster"
          :alt="userMovie.movie.title"
        />

        <CommonFormsConfigurableFields :config="editFormLayout" class="min-w-0 flex-1">
          <template #movieTitle>
            <div>
              <div class="text-sm text-gray-500">Название</div>
              <div class="text-xl font-medium text-gray-900">{{ userMovie.movie.title }}</div>
            </div>
          </template>

          <template #directors>
            <div>
              <div class="text-sm text-gray-500">Режиссёры</div>
              <div v-if="userMovie.movie.directors?.length" class="mt-1 flex flex-wrap gap-2">
                <NuxtLink
                  v-for="director in userMovie.movie.directors"
                  :key="director.id"
                  :to="`/movies/directors/${director.id}`"
                  class="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
                >
                  {{ director.fullName }}
                </NuxtLink>
              </div>
              <div v-else class="text-base text-gray-900">—</div>
            </div>
          </template>

          <template #genre>
            <div>
              <div class="text-sm text-gray-500">Жанр</div>
              <div class="text-base text-gray-900">{{ userMovie.movie.genre ?? '—' }}</div>
            </div>
          </template>

          <template #releaseYear>
            <div>
              <div class="text-sm text-gray-500">Год выхода</div>
              <div class="text-base text-gray-900">{{ userMovie.movie.releaseYear ?? '—' }}</div>
            </div>
          </template>

          <template #rating>
            <EntitiesUserMoviesInputsRating
              v-model="form.rating"
              :error="errors.rating"
              :disabled="isFormDisabled"
            />
          </template>

          <template #watchedAt>
            <EntitiesUserMoviesInputsWatchedAt
              v-model="form.watchedAt"
              :error="errors.watchedAt"
              :disabled="isFormDisabled"
            />
          </template>

          <template #comment>
            <EntitiesUserMoviesInputsComment
              v-model="form.comment"
              :error="errors.comment"
              :disabled="isFormDisabled"
            />
          </template>
        </CommonFormsConfigurableFields>
      </div>

      <div
        v-if="saveError"
        role="alert"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ saveError }}
      </div>
    </div>

    <div class="mt-6 flex items-center justify-end gap-3">
      <button
        type="button"
        :disabled="submitting"
        class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        @click="router.push(`/user-movies/${userMovieId}`)"
      >
        Отмена
      </button>
      <button
        v-if="userMovie && !loadError"
        type="submit"
        :disabled="isFormDisabled"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {{ submitting ? 'Сохранение...' : 'Сохранить изменения' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { UpdateUserMovieDto } from '~/types/api'

const props = defineProps<{ userMovieId: string }>()
const emit = defineEmits<{ 'title-loaded': [title: string] }>()
const router = useRouter()
const { get, update } = useUserMovies()
const { getApiErrorMessage } = useAuth()

const form = reactive<{ rating?: number; watchedAt: string; comment: string }>({
  rating: undefined,
  watchedAt: '',
  comment: '',
})
const submitting = ref(false)
const saveError = ref('')
const errors = ref<Record<string, string>>({})

const {
  data: userMovie,
  pending: loading,
  error: loadError,
  refresh,
} = useLazyAsyncData(`user-movie-edit-${props.userMovieId}`, () => get(props.userMovieId), {
  server: false,
})

watch(
  userMovie,
  (record) => {
    if (!record) return
    emit('title-loaded', record.movie.title)
    form.rating = record.rating ?? undefined
    form.watchedAt = record.watchedAt?.slice(0, 10) ?? ''
    form.comment = record.comment ?? ''
  },
  { immediate: true },
)

const isFormDisabled = computed(() => loading.value || submitting.value)
const editFormLayout = [
  { columns: 1, fields: [{ id: 'movieTitle' }] },
  { columns: 2, fields: [{ id: 'directors' }, { id: 'genre' }] },
  { columns: 1, fields: [{ id: 'releaseYear' }] },
  { columns: 2, fields: [{ id: 'rating' }, { id: 'watchedAt' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
]

const onSubmit = async () => {
  if (isFormDisabled.value || !userMovie.value || loadError.value) return
  saveError.value = ''
  errors.value = {}

  if (
    form.rating != null &&
    (!Number.isInteger(form.rating) || form.rating < 0 || form.rating > 100)
  ) {
    errors.value.rating = 'Введите целую оценку от 0 до 100.'
  }

  const date = form.watchedAt ? new Date(`${form.watchedAt}T00:00:00.000Z`) : null
  if (
    date &&
    (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== form.watchedAt)
  ) {
    errors.value.watchedAt = 'Введите корректную дату просмотра.'
  }
  if (Object.keys(errors.value).length) return

  const originalDate = userMovie.value.watchedAt
  const body: UpdateUserMovieDto = {
    rating: form.rating ?? null,
    watchedAt:
      form.watchedAt === originalDate?.slice(0, 10) ? originalDate : (date?.toISOString() ?? null),
    comment: form.comment.trim(),
  }

  submitting.value = true
  try {
    await update(props.userMovieId, body)
    clearNuxtData([`user-movie-${props.userMovieId}`, 'user-movies'])
    await router.push(`/user-movies/${props.userMovieId}`)
  } catch (error: unknown) {
    saveError.value = getApiErrorMessage(error)
    const response = error as {
      data?: { message?: string | string[]; violations?: { field: string; message: string }[] }
    }
    const messages = response?.data?.message
    if (Array.isArray(messages)) {
      for (const message of messages) {
        const field = message.split(' ')[0]
        if (['rating', 'watchedAt', 'comment'].includes(field)) errors.value[field] = message
      }
    }
    for (const violation of response?.data?.violations ?? []) {
      if (['rating', 'watchedAt', 'comment'].includes(violation.field)) {
        errors.value[violation.field] = violation.message
      }
    }
  } finally {
    submitting.value = false
  }
}
</script>
