<template>
  <form class="px-6 py-6" @submit.prevent="onSubmit">
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
          <EntitiesPublishersInputsFullNameSearch
            v-model="suggestion"
            v-model:manual-query="manualName"
            :error="errors.fullName"
          />
        </template>

        <template #comment>
          <EntitiesPublishersInputsComment v-model="form.comment" :error="errors.comment" />
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
import type { RawgCompanySuggestion } from '~/components/integrations/igdb-games.service'

const route = useRoute()
const publishersApi = usePublishers()
const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const form = ref({
  comment: '',
})

const suggestion = ref<RawgCompanySuggestion | null>(null)
const manualName = ref('')
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
let suggestionPhoto: File | null = null

const formLayout = [
  { columns: 1, fields: [{ id: 'fullName' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
]

const redirectTo = computed(() => safeRedirectTo(route.query.redirectTo, '/games/publishers'))

const hasOwnPhoto = () => photoFile.value !== null && photoFile.value !== suggestionPhoto

watch(suggestion, async (newSuggestion) => {
  const image = newSuggestion?.image
  if (!image || hasOwnPhoto()) return

  try {
    const response = await fetch(`/api/proxy?url=${encodeURIComponent(image)}`)
    const blob = await response.blob()
    if (suggestion.value !== newSuggestion || hasOwnPhoto()) return

    suggestionPhoto = new File([blob], 'publisher.jpg', { type: blob.type || 'image/jpeg' })
    photoFile.value = suggestionPhoto
    photoPreview.value = image
  } catch (e) {
    console.error('Failed to fetch publisher image:', e)
  }
})

const onSubmit = async () => {
  if (submitting.value) return

  try {
    submitting.value = true
    errors.value = {}
    error.value = ''

    const fullName = manualName.value.trim()
    if (!fullName) {
      errors.value.fullName = 'Название издателя обязательно'
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

    await publishersApi.create(formData)

    await navigateTo(redirectTo.value)
  } catch (e) {
    const { message, violations } = parseRequestError(e)
    errors.value = violations
    error.value = message
  } finally {
    submitting.value = false
  }
}
</script>
