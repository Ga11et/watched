<template>
  <form @submit.prevent="onSubmit" class="px-6 py-6">
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
          <EntitiesAuthorsInputsFullName
            v-model="form.fullName"
            :error="errors.fullName"
            @select="onPersonSelect"
          />
        </template>

        <template #comment>
          <EntitiesAuthorsInputsComment v-model="form.comment" :error="errors.comment" />
        </template>
      </CommonFormsConfigurableFields>
    </div>

    <div
      v-if="error"
      class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mt-3"
    >
      {{ error }}
    </div>

    <div class="mt-6 flex items-center justify-end gap-3">
      <NuxtLink
        to="/books/authors"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        Отмена
      </NuxtLink>
      <button
        type="submit"
        :disabled="submitting"
        class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {{ submitting ? 'Сохранение...' : 'Создать' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { TmdbPerson } from '~/types/api'

const config = useRuntimeConfig()
const route = useRoute()

const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

const form = reactive({
  fullName: '',
  comment: '',
})

const formLayout = [
  { columns: 1, fields: [{ id: 'fullName' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
]

const onPersonSelect = async (person: TmdbPerson) => {
  form.fullName = person.name

  if (person.profile_path && !photoFile.value) {
    try {
      const photoUrl = `https://image.tmdb.org/t/p/w500${person.profile_path}`
      const response = await fetch(photoUrl)
      const blob = await response.blob()
      const file = new File([blob], 'author-photo.jpg', { type: 'image/jpeg' })

      photoFile.value = file
      photoPreview.value = photoUrl
    } catch (e) {
      console.warn('Failed to fetch author photo from TMDb:', e)
    }
  }
}

const validateForm = (): boolean => {
  error.value = ''
  errors.value = {}

  if (!form.fullName.trim()) {
    errors.value.fullName = 'Полное имя автора обязательно'
    return false
  }

  if (form.fullName.length > 200) {
    errors.value.fullName = 'Имя слишком длинное'
    return false
  }

  return true
}

const onSubmit = async () => {
  if (submitting.value) return
  if (!validateForm()) return

  submitting.value = true
  try {
    const formData = new FormData()

    formData.append('fullName', form.fullName.trim())

    if (form.comment?.trim()) {
      formData.append('comment', form.comment.trim())
    }

    if (photoFile.value) {
      formData.append('photo', photoFile.value)
    }

    await _fetch(`${config.public.apiBase}/authors`, {
      method: 'POST',
      body: formData,
    })

    const redirectTo = route.query.redirectTo as string
    navigateTo(redirectTo || '/books/authors')
  } catch (e: any) {
    const base = e?.data?.message || e?.message || 'Произошла ошибка при создании автора'
    const violations = e?.data?.violations
    if (Array.isArray(violations) && violations.length) {
      violations.forEach((v) => {
        errors.value[v.field] = v.message
      })
    }
    error.value = base
  } finally {
    submitting.value = false
  }
}
</script>
