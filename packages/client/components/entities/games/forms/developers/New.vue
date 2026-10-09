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

      <CommonFormsConfigurableFields :config="developerFormLayout" class="flex-1">
        <template #fullName>
          <div>
            <label for="fullName" class="block text-sm font-medium text-gray-700">
              Полное имя разработчика<span class="text-red-500">*</span>
            </label>
            <IntegrationsDevelopersAutocomplete
              id="fullName"
              v-model="selectedDeveloper"
              v-model:manual-query="form.fullName"
              placeholder="Найдите разработчика..."
              :error="errors.fullName"
              @select="onDeveloperSelect"
            />
          </div>
        </template>

        <template #comment>
          <div>
            <label for="comment" class="mb-1 block text-sm font-medium text-gray-700">
              Комментарий
            </label>
            <textarea
              id="comment"
              v-model="form.comment"
              rows="3"
              class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Дополнительная информация о разработчике"
            ></textarea>
          </div>
        </template>
      </CommonFormsConfigurableFields>
    </div>

    <div class="mt-6 flex items-center justify-end gap-3">
      <NuxtLink
        to="/games/developers"
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

    <div
      v-if="error"
      class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </div>
  </form>
</template>

<script setup lang="ts">
import type { RawgCompanySuggestion } from '~/components/integrations/igdb-games.service'

interface FormFieldConfig {
  id: string
}

interface FormRowConfig {
  columns?: number
  fields: FormFieldConfig[]
}

const { request } = useApiRequest()
const route = useRoute()

const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const selectedDeveloper = ref<RawgCompanySuggestion | null>(null)

const form = reactive({
  fullName: '',
  comment: '',
})

const developerFormLayout: FormRowConfig[] = [
  {
    columns: 1,
    fields: [{ id: 'fullName' }],
  },
  {
    columns: 1,
    fields: [{ id: 'comment' }],
  },
]

const validateForm = () => {
  errors.value = {}

  if (!form.fullName.trim()) {
    errors.value.fullName = 'Полное имя разработчика обязательно'
    throw new Error('Validation failed')
  }

  if (form.fullName.length > 200) {
    errors.value.fullName = 'Имя слишком длинное'
    throw new Error('Validation failed')
  }
}

const preparePayload = () => {
  const formData = new FormData()

  formData.append('fullName', form.fullName.trim())

  if (form.comment?.trim()) {
    formData.append('comment', form.comment.trim())
  }

  if (photoFile.value) {
    formData.append('photo', photoFile.value)
  }

  return formData
}

const handleErrors = (e: any) => {
  const base = e?.data?.message || e?.message || 'Произошла ошибка при создании разработчика'
  const violations = e?.data?.violations

  if (Array.isArray(violations) && violations.length) {
    violations.forEach((v) => {
      errors.value[v.field] = v.message
    })
  }

  error.value = base
}

const onSubmit = async () => {
  if (submitting.value) {
    return
  }

  submitting.value = true
  errors.value = {}
  error.value = ''

  try {
    validateForm()

    const payload = preparePayload()

    await request(`/developers`, {
      method: 'POST',
      body: payload,
    })

    const redirectTo = route.query.redirectTo as string
    await navigateTo(redirectTo || '/games/developers')
  } catch (e: any) {
    handleErrors(e)
  } finally {
    submitting.value = false
  }
}

const onDeveloperSelect = (developer: RawgCompanySuggestion) => {
  form.fullName = developer.name

  if (developer.image && !photoFile.value) {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(developer.image)}`

    fetch(proxyUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], 'developer.jpg', {
          type: blob.type || 'image/jpeg',
        })
        photoFile.value = file
        photoPreview.value = developer.image || null
      })
      .catch((fetchError) => {
        console.warn('Failed to fetch developer image:', fetchError)
      })
  }
}
</script>
