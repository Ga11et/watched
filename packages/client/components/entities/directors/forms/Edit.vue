<template>
  <form class="px-6 py-6" @submit.prevent="onSubmit">
    <div v-if="loading" class="text-center py-6 text-gray-500">Загрузка...</div>
    <div
      v-else-if="loadError"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ loadError }}
    </div>

    <div v-else-if="director" class="space-y-6">
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
            <EntitiesDirectorsInputsFullName
              v-model="form.fullName"
              :error="errors.fullName"
              :disabled="isFormDisabled"
            />
          </template>

          <template #comment>
            <EntitiesDirectorsInputsComment
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
          :to="`/movies/directors/${directorId}`"
          class="rounded-lg px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          Отмена
        </NuxtLink>
        <button
          type="submit"
          :disabled="isFormDisabled"
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
    </div>
  </form>
</template>

<script setup lang="ts">
import type { Director } from '~/types/api'

const props = defineProps<{ directorId: string }>()
const emit = defineEmits<{ 'title-loaded': [title: string] }>()
const { request } = useApiRequest()
const config = useRuntimeConfig()

const loadError = ref('')
const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const form = ref({
  fullName: '',
  comment: '',
})

const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const formLayout = [
  { columns: 1, fields: [{ id: 'fullName' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
]

const { data: director, pending: loading } = useAsyncData(
  `director-edit-${props.directorId}`,
  async () => {
    try {
      loadError.value = ''
      return await request<Director>(`/directors/${props.directorId}`)
    } catch (e) {
      const err = e as { data?: { message?: string } }
      loadError.value = err.data?.message || 'Не удалось загрузить режиссёра'
      return null
    }
  },
  { server: false },
)

watch(
  director,
  (data) => {
    if (!data) return
    emit('title-loaded', data.fullName)
    form.value.fullName = data.fullName || ''
    form.value.comment = data.comment || ''
    photoPreview.value = data.photo ? `${config.public.apiBase}${data.photo}` : null
  },
  { immediate: true },
)

const isFormDisabled = computed(() => loading.value || submitting.value)

const onSubmit = async () => {
  if (isFormDisabled.value || !director.value || loadError.value) return

  try {
    submitting.value = true
    errors.value = {}
    error.value = ''

    const fullName = form.value.fullName.trim()
    if (!fullName) {
      errors.value.fullName = 'ФИО обязательно'
      return
    }

    const formData = new FormData()
    formData.append('fullName', fullName)
    if (form.value.comment?.trim()) {
      formData.append('comment', form.value.comment.trim())
    }
    if (photoFile.value) {
      formData.append('photo', photoFile.value)
    } else if (director.value?.photo && !photoPreview.value) {
      // Если было фото и превью убрали - значит надо удалить фото
      formData.append('removePhoto', 'true')
    }

    await request(`/directors/${props.directorId}`, {
      method: 'PUT',
      body: formData,
    })

    await navigateTo(`/movies/directors/${props.directorId}`)
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
    error.value = base ?? 'Произошла ошибка при обновлении режиссёра'
  } finally {
    submitting.value = false
  }
}
</script>
