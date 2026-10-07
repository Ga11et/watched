<template>
  <form novalidate class="px-6 py-6" @submit.prevent="onSubmit">
    <CommonFormsConfigurableFields :config="newFormLayout">
      <template #title>
        <CommonInputsTextInput
          id="title"
          v-model="form.title"
          label="Название *"
          placeholder="Название фильма"
          hint="Обязательное поле."
          :error="errors.title"
          :disabled="submitting"
        />
      </template>

      <template #rating>
        <EntitiesUserMoviesInputsRating
          v-model="form.rating"
          :error="errors.rating"
          :disabled="submitting"
        />
      </template>

      <template #watchedAt>
        <EntitiesUserMoviesInputsWatchedAt
          v-model="form.watchedAt"
          :error="errors.watchedAt"
          :disabled="submitting"
        />
      </template>

      <template #comment>
        <EntitiesUserMoviesInputsComment
          v-model="form.comment"
          :error="errors.comment"
          :disabled="submitting"
        />
      </template>
    </CommonFormsConfigurableFields>

    <div
      v-if="saveError"
      role="alert"
      class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ saveError }}
    </div>

    <div class="mt-6 flex items-center justify-end gap-3">
      <button
        type="button"
        :disabled="submitting"
        class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        @click="router.push('/user-movies')"
      >
        Отмена
      </button>
      <button
        type="submit"
        :disabled="submitting"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {{ submitting ? 'Сохранение...' : 'Создать' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { CreateUserMovieDto } from '~/types/api'

const router = useRouter()
const { create } = useUserMovies()
const { getApiErrorMessage } = useAuth()
const form = reactive<{ title: string; rating?: number; watchedAt: string; comment: string }>({
  title: '',
  rating: undefined,
  watchedAt: '',
  comment: '',
})
const submitting = ref(false)
const saveError = ref('')
const errors = ref<Record<string, string>>({})

const newFormLayout = [
  { columns: 1, fields: [{ id: 'title' }] },
  { columns: 2, fields: [{ id: 'rating' }, { id: 'watchedAt' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
]

const onSubmit = async () => {
  if (submitting.value) return
  saveError.value = ''
  errors.value = {}

  if (!form.title.trim()) errors.value.title = 'Название обязательно'
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

  const body: CreateUserMovieDto = { title: form.title.trim() }
  if (form.rating != null) body.rating = form.rating
  if (date) body.watchedAt = date.toISOString()
  if (form.comment.trim()) body.comment = form.comment.trim()

  submitting.value = true
  try {
    await create(body)
    clearNuxtData('user-movies')
    await router.push('/user-movies')
  } catch (error: unknown) {
    saveError.value = getApiErrorMessage(error)
    const response = error as {
      data?: { message?: string | string[]; violations?: { field: string; message: string }[] }
    }
    const fields = ['title', 'rating', 'watchedAt', 'comment']
    const messages = response?.data?.message
    if (Array.isArray(messages)) {
      for (const message of messages) {
        const field = message.split(' ')[0]
        if (fields.includes(field)) {
          errors.value[field] = message
        }
      }
    }
    for (const violation of response?.data?.violations ?? []) {
      if (fields.includes(violation.field)) {
        errors.value[violation.field] = violation.message
      }
    }
  } finally {
    submitting.value = false
  }
}
</script>
