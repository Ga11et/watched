<template>
  <form @submit.prevent="onSubmit" class="px-6 py-6">
    <div v-if="loading" class="text-center py-6 text-gray-500">Загрузка...</div>

    <div
      v-else-if="loadError"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ loadError }}
    </div>

    <div v-else-if="author" class="space-y-6">
      <div class="flex gap-6">
        <UiPhotoUpload
          v-model="photoFile"
          v-model:preview="photoPreview"
          label="Фото"
          :error="errors.photo"
          :disabled="isFormDisabled"
          class="flex-shrink-0"
        />

        <CommonFormsConfigurableFields :config="formLayout" class="flex-1">
          <template #fullName>
            <EntitiesAuthorsInputsFullName
              v-model="form.fullName"
              :error="errors.fullName"
              :disabled="isFormDisabled"
              @select="onPersonSelect"
            />
          </template>

          <template #comment>
            <EntitiesAuthorsInputsComment
              v-model="form.comment"
              :error="errors.comment"
              :disabled="isFormDisabled"
            />
          </template>
        </CommonFormsConfigurableFields>
      </div>

      <div
        v-if="error"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <div class="flex items-center justify-end gap-3">
        <NuxtLink
          :to="`/books/authors/${authorId}`"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Отмена
        </NuxtLink>
        <button
          type="submit"
          :disabled="isFormDisabled"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {{ submitting ? 'Сохранение...' : 'Сохранить изменения' }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { TmdbPerson } from '~/types/api'

interface Props {
  authorId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'name-loaded': [name: string]
}>()

const config = useRuntimeConfig()
const router = useRouter()

const submitting = ref(false)
const loadError = ref('')
const error = ref('')
const errors = ref<Record<string, string>>({})

const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

const isFormDisabled = computed(() => loading.value || submitting.value)

const form = reactive({
  fullName: '',
  comment: '',
})

const formLayout = [
  { columns: 1, fields: [{ id: 'fullName' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
]

interface AuthorData {
  id: string
  fullName: string
  comment?: string | null
  photo?: string | null
  createdAt: string
  updatedAt: string
}

const { data: author, pending: loading } = useAsyncData(
  `author-edit-${props.authorId}`,
  async () => {
    try {
      loadError.value = ''
      return await _fetch<AuthorData>(`${config.public.apiBase}/authors/${props.authorId}`)
    } catch (e: any) {
      loadError.value = e?.data?.message || 'Не удалось загрузить автора'
      return null
    }
  },
  { server: false },
)

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

watch(author, (data) => {
  if (!data) return

  emit('name-loaded', data.fullName)

  form.fullName = data.fullName || ''
  form.comment = data.comment || ''

  if (data.photo) {
    photoPreview.value = data.photo.startsWith('http')
      ? data.photo
      : `${config.public.apiBase}${data.photo}`
  }
})

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
  if (isFormDisabled.value) return
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
    } else if (author.value?.photo && !photoPreview.value) {
      formData.append('removePhoto', 'true')
    }

    await _fetch(`${config.public.apiBase}/authors/${props.authorId}`, {
      method: 'PUT',
      body: formData,
    })

    await router.push(`/books/authors/${props.authorId}`)
  } catch (e: any) {
    const base = e?.data?.message || e?.message || 'Произошла ошибка при обновлении автора'
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
