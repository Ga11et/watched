<template>
  <form class="px-6 py-6" @submit.prevent="onSubmit">
    <div v-if="loading" class="text-center py-6 text-gray-500">Загрузка...</div>

    <div
      v-else-if="loadError"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ loadError }}
    </div>

    <div v-else-if="book" class="space-y-6">
      <div class="flex gap-6">
        <UiPhotoUpload
          v-model="coverFile"
          v-model:preview="coverPreview"
          label="Обложка"
          :error="errors.cover"
          :disabled="isFormDisabled"
          class="flex-shrink-0"
        />

        <CommonFormsConfigurableFields :config="formLayout" class="flex-1">
          <template #title>
            <EntitiesBooksInputsTitle
              v-model="form.title"
              :error="errors.title"
              :disabled="isFormDisabled"
              @select="onBookSelect"
            />
          </template>

          <template #authors>
            <EntitiesBooksInputsAuthors
              v-model="form.authors"
              :error="errors.authors"
              :disabled="isFormDisabled"
            />
          </template>

          <template #genre>
            <EntitiesBooksInputsGenre
              v-model="form.genre"
              :error="errors.genre"
              :disabled="isFormDisabled"
            />
          </template>

          <template #pageCount>
            <EntitiesBooksInputsPages
              v-model="form.pageCount"
              :error="errors.pageCount"
              :disabled="isFormDisabled"
            />
          </template>

          <template #publishYear>
            <EntitiesBooksInputsPublished
              v-model="form.publishYear"
              :error="errors.publishYear"
              :disabled="isFormDisabled"
            />
          </template>

          <template #comment>
            <EntitiesBooksInputsComment
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
          :to="`/books/${bookId}`"
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
import type { GoogleBook } from '~/components/integrations/google-books.service'
import type { Author, Book } from '~/types/api'

interface Props {
  bookId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'title-loaded': [title: string]
}>()

const { request } = useApiRequest()
const config = useRuntimeConfig()
const router = useRouter()

const submitting = ref(false)
const loadError = ref('')
const error = ref('')
const errors = ref<Record<string, string>>({})

const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)

const isFormDisabled = computed(() => loading.value || submitting.value)

const form = reactive({
  title: '',
  authors: [] as Author[],
  genre: '',
  publishYear: undefined as string | undefined,
  pageCount: undefined as number | undefined,
  comment: '',
})

const formLayout = [
  { columns: 1, fields: [{ id: 'title' }] },
  { columns: 2, fields: [{ id: 'authors' }, { id: 'genre' }] },
  { columns: 2, fields: [{ id: 'pageCount' }, { id: 'publishYear' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
]

const { data: book, pending: loading } = useAsyncData(
  `book-edit-${props.bookId}`,
  async () => {
    try {
      loadError.value = ''
      return await request<Book>(`/books/${props.bookId}`)
    } catch (e: unknown) {
      const err = e as { data?: { message?: string } }
      loadError.value = err?.data?.message || 'Не удалось загрузить книгу'
      return null
    }
  },
  { server: false },
)

const onBookSelect = (googleBook: GoogleBook) => {
  form.title = googleBook.title

  if (googleBook.description) {
    form.comment = googleBook.description
  }

  if (googleBook.publishedDate) {
    const year = parseInt(googleBook.publishedDate)
    if (!isNaN(year) && year > 1800 && year <= new Date().getFullYear()) {
      form.publishYear = String(year)
    }
  }

  if (googleBook.pageCount && googleBook.pageCount > 0) {
    form.pageCount = googleBook.pageCount
  }

  if (googleBook.genres) {
    form.genre = googleBook.genres
  }

  if (googleBook.cover) {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(googleBook.cover)}`
    fetch(proxyUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
        coverFile.value = file
        coverPreview.value = googleBook.cover || null
      })
      .catch((fetchError) => {
        console.warn('Failed to fetch book cover:', fetchError)
      })
  }
}

watch(book, (data) => {
  if (!data) return

  emit('title-loaded', data.title)

  form.title = data.title || ''
  form.authors = data.authors || []
  form.genre = data.genre || ''
  form.publishYear = data.publishYear != null ? String(data.publishYear) : undefined
  form.pageCount = data.pageCount != null ? Number(data.pageCount) : undefined
  form.comment = data.comment || ''

  if (data.cover) {
    coverPreview.value = data.cover.startsWith('http')
      ? data.cover
      : `${config.public.apiBase}${data.cover}`
  }
})

const validateForm = (): boolean => {
  error.value = ''
  errors.value = {}

  if (!form.title.trim()) {
    errors.value.title = 'Название книги обязательно'
    return false
  }

  if (form.title.length > 200) {
    errors.value.title = 'Название слишком длинное'
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

    formData.append('title', form.title.trim())

    if (form.authors.length) {
      form.authors.forEach((author) => {
        formData.append('authorIds[]', author.id)
      })
    }

    if (form.comment?.trim()) {
      formData.append('comment', form.comment.trim())
    }

    if (form.publishYear) {
      formData.append('publishYear', form.publishYear.toString())
    }

    if (form.pageCount) {
      formData.append('pageCount', form.pageCount.toString())
    }

    if (form.genre?.trim()) {
      formData.append('genre', form.genre.trim())
    }

    if (coverFile.value) {
      formData.append('cover', coverFile.value)
    } else if (book.value?.cover && !coverPreview.value) {
      formData.append('removeCover', 'true')
    }

    await request(`/books/${props.bookId}`, {
      method: 'PUT',
      body: formData,
    })

    await router.push(`/books/${props.bookId}`)
  } catch (e: unknown) {
    const err = e as {
      message?: string
      data?: { message?: string; violations?: Array<{ field: string; message: string }> }
    }
    const base = err?.data?.message || err?.message || 'Произошла ошибка при обновлении книги'
    const violations = err?.data?.violations
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
