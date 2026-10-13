<template>
  <form class="px-6 py-6" @submit.prevent="onSubmit">
    <IntegrationsTmdbPersonCard
      v-if="person"
      :person="person"
      title="Выбранный режиссёр (TMDB)"
      class="mb-6"
    />

    <div class="flex gap-6">
      <UiPhotoUpload
        v-model="photoFile"
        v-model:preview="photoPreview"
        label="Фото"
        :error="errors.photo"
        class="flex-shrink-0"
      />

      <CommonFormsConfigurableFields :config="formLayout" class="flex-1">
        <template #fullName>
          <EntitiesDirectorsInputsFullNameSearch
            v-model="person"
            v-model:manual-query="manualName"
            :error="errors.fullName"
          />
        </template>

        <template #comment>
          <EntitiesDirectorsInputsComment v-model="form.comment" :error="errors.comment" />
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
        :to="redirectTo"
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
        <span>{{ submitting ? 'Сохранение...' : 'Создать' }}</span>
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { TmdbPerson } from '~/types/api'

const route = useRoute()
const directorsApi = useDirectors()
const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const form = ref({
  comment: '',
})

const person = ref<TmdbPerson | null>(null)
const manualName = ref('')
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

const formLayout = [
  { columns: 1, fields: [{ id: 'fullName' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
]

const redirectTo = computed(() => {
  const target = route.query.redirectTo
  return typeof target === 'string' &&
    target.startsWith('/') &&
    !target.startsWith('//') &&
    !target.includes('\\')
    ? target
    : '/movies/directors'
})

watch(person, async (newPerson) => {
  if (newPerson?.profile_path) {
    const url = `https://image.tmdb.org/t/p/w500${newPerson.profile_path}`
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      photoFile.value = new File([blob], `${newPerson.id}.jpg`, { type: blob.type })
      photoPreview.value = url
    } catch (e) {
      console.error('Failed to fetch TMDB photo:', e)
    }
  }
})

const onSubmit = async () => {
  if (submitting.value) return

  try {
    submitting.value = true
    errors.value = {}
    error.value = ''

    const fullName = person.value?.name || manualName.value.trim()
    if (!fullName) {
      errors.value.fullName = 'Укажите ФИО режиссёра'
      return
    }

    const formData = new FormData()
    formData.append('fullName', fullName)
    if (form.value.comment?.trim()) {
      formData.append('comment', form.value.comment.trim())
    }
    if (photoFile.value) {
      formData.append('photo', photoFile.value)
    }

    await directorsApi.create(formData)

    await navigateTo(redirectTo.value)
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
    error.value = base ?? 'Произошла ошибка при создании режиссёра'
  } finally {
    submitting.value = false
  }
}
</script>
