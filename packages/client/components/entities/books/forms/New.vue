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

      <CommonFormsConfigurableFields :config="formLayout" class="flex-1">
        <template #title>
          <EntitiesBooksInputsTitle
            v-model="form.title"
            :error="errors?.title"
            @select="onBookSelect"
          />
        </template>

        <template #authors>
          <EntitiesBooksInputsAuthors v-model="form.authors" :error="errors.authors" />
        </template>

        <template #genre>
          <EntitiesBooksInputsGenre v-model="form.genre" :error="errors.genre" />
        </template>

        <template #pageCount>
          <EntitiesBooksInputsPages v-model="form.pageCount" :error="errors.pageCount" />
        </template>

        <template #publishYear>
          <EntitiesBooksInputsPublished v-model="form.publishYear" :error="errors.publishYear" />
        </template>

        <template #comment>
          <EntitiesBooksInputsComment v-model="form.comment" :error="errors.comment" />
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
        to="/books"
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
import type { Author } from '~/types/api'

const { request } = useApiRequest()
const router = useRouter()
const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)

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

const onBookSelect = (book: GoogleBook) => {
  form.title = book.title

  if (book.description) {
    form.comment = book.description
  }

  if (book.publishedDate) {
    const year = parseInt(book.publishedDate)
    if (!isNaN(year) && year > 1800 && year <= new Date().getFullYear()) {
      form.publishYear = String(year)
    }
  }

  if (book.pageCount && book.pageCount > 0) {
    form.pageCount = book.pageCount
  }

  if (book.genres) {
    form.genre = book.genres
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
    }

    await request(`/books`, {
      method: 'POST',
      body: formData,
    })

    await router.push('/books')
  } catch (e: any) {
    const base = e?.data?.message || e?.message || 'Произошла ошибка при создании книги'
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
