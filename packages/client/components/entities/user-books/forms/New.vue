<template>
  <form @submit.prevent="onSubmit" class="px-6 py-6">
    <div class="flex gap-6">
      <UiPhotoUpload
        v-model="coverFile"
        v-model:preview="coverPreview"
        label="Обложка"
        :error="errors.cover"
        class="flex-shrink-0"
      />

      <CommonFormsConfigurableFields :config="bookFormLayout" class="flex-1">
        <template #title>
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700"
              >Название<span class="text-red-500">*</span></label
            >
            <IntegrationsBookAutocomplete
              id="title"
              v-model="selectedBook"
              v-model:manual-query="form.title"
              placeholder="Найти книгу..."
              :error="errors?.title"
              @select="onBookSelect"
            />
          </div>
        </template>

        <template #rating>
          <EntitiesUserBooksInputsRating v-model="form.rating" :error="errors.rating" />
        </template>

        <template #readAt>
          <EntitiesUserBooksInputsReadAt v-model="form.readAt" :error="errors.readAt" />
        </template>

        <template #comment>
          <EntitiesUserBooksInputsComment v-model="form.comment" :error="errors.comment" />
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
        to="/user-books"
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
import type { GoogleBook } from '~/components/integrations/google-books.service'

const config = useRuntimeConfig()
const router = useRouter()
const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)
const selectedBook = ref<GoogleBook | null>(null)

const form = reactive({
  title: '',
  readAt: new Date().toISOString().slice(0, 10),
  comment: '',
  rating: undefined as number | undefined,
})

const bookFormLayout = [
  {
    columns: 1,
    fields: [{ id: 'title' }],
  },
  {
    columns: 2,
    fields: [{ id: 'rating' }, { id: 'readAt' }],
  },
  {
    columns: 1,
    fields: [{ id: 'comment' }],
  },
]

const onBookSelect = (book: GoogleBook) => {
  form.title = book.title

  if (book.description) {
    form.comment = book.description
  }

  if (book.publishedDate) {
    const parsedDate = new Date(book.publishedDate)
    if (!Number.isNaN(parsedDate.getTime())) {
      form.readAt = parsedDate.toISOString().slice(0, 10)
    }
  }

  if (book.cover && !coverFile.value) {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(book.cover)}`
    fetch(proxyUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
        coverFile.value = file
        coverPreview.value = book.cover || null
      })
      .catch((fetchError) => {
        console.warn('Failed to fetch book cover:', fetchError)
      })
  }
}

const onSubmit = async () => {
  error.value = ''
  errors.value = {}
  if (!form.title.trim()) {
    errors.value.title = 'Название обязательно'
    return
  }
  if (form.title.length > 200) {
    errors.value.title = 'Название слишком длинное'
    return
  }
  submitting.value = true
  try {
    const formData = new FormData()

    formData.append('title', form.title.trim())

    if (typeof form.rating === 'number') {
      formData.append('rating', form.rating.toString())
    }

    if (form.readAt) {
      formData.append('readAt', `${form.readAt}T00:00:00.000Z`)
    }

    if (form.comment?.trim()) {
      formData.append('comment', form.comment.trim())
    }

    if (coverFile.value) {
      formData.append('cover', coverFile.value)
    }

    await _fetch(`${config.public.apiBase}/user-books`, {
      method: 'POST',
      body: formData,
    })

    await router.push('/user-books')
  } catch (e: any) {
    const base = e?.data?.message || e?.message || 'Не удалось создать книгу'
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
