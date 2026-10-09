<template>
  <form @submit.prevent="onSubmit" class="px-6 py-6">
    <div class="flex gap-6">
      <UiPhotoUpload
        v-model="coverFile"
        v-model:preview="coverPreview"
        label="Обложка"
        :error="errors.cover"
        :disabled="isLocal"
        class="flex-shrink-0"
      />

      <CommonFormsConfigurableFields :config="bookFormLayout" class="flex-1">
        <template #title>
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700"
              >Название<span class="text-red-500">*</span></label
            >
            <EntitiesUserBooksInputsSearch
              id="title"
              v-model="selectedBook"
              v-model:manual-query="form.title"
              placeholder="Найти книгу..."
              :error="errors?.title"
              @select="onBookSelect"
            />
          </div>
        </template>

        <template #authorId>
          <EntitiesUserBooksInputsAuthors
            :disabled="isLocal"
            v-model="coreBookForm.authors"
            :error="errors.authors"
          />
        </template>

        <template #genre>
          <EntitiesUserBooksInputsGanre
            :disabled="isLocal"
            v-model="coreBookForm.genre"
            :error="errors.genre"
          />
        </template>

        <template #pageCount>
          <EntitiesUserBooksInputsPages
            :disabled="isLocal"
            v-model="coreBookForm.pageCount"
            :error="errors.pageCount"
          />
        </template>

        <template #publishYear>
          <EntitiesUserBooksInputsPublished
            :disabled="isLocal"
            v-model="coreBookForm.publishYear"
            :error="errors.publishYear"
          />
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
import type { Author, Book } from '~/types/api'
import type { GoogleBook } from '~/components/integrations/google-books.service'

const { request } = useApiRequest()
const config = useRuntimeConfig()
const router = useRouter()
const submitting = ref(false)
const isLocal = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)

interface UserBookSearchResult {
  id: string
  title: string
  source: 'local' | 'public'
  localBook?: Book
  googleBook?: GoogleBook
}

const selectedBook = ref<UserBookSearchResult | null>(null)

const form = reactive({
  title: '',
  readAt: new Date().toISOString().slice(0, 10),
  comment: '',
  rating: undefined as number | undefined,
})

const coreBookForm = reactive({
  authors: [] as Author[],
  publishYear: undefined as string | undefined,
  pageCount: undefined as number | undefined,
  genre: undefined as string | undefined,
})

const bookFormLayout = [
  {
    columns: 1,
    fields: [{ id: 'title' }],
  },

  {
    columns: 2,
    fields: [{ id: 'authorId' }, { id: 'genre' }],
  },
  {
    columns: 2,
    fields: [{ id: 'pageCount' }, { id: 'publishYear' }],
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

const onBookSelect = (book: UserBookSearchResult) => {
  if (book.source === 'local') {
    form.title = book.localBook?.title || book.title
    isLocal.value = book.source === 'local'
    coverPreview.value = book.localBook?.cover ? config.public.apiBase + book.localBook.cover : null

    coreBookForm.genre = book.localBook?.genre || undefined
    coreBookForm.pageCount = book.localBook?.pageCount ? +book.localBook.pageCount : undefined
    coreBookForm.publishYear = book.localBook?.publishYear
      ? String(book.localBook.publishYear)
      : undefined
    return
  }

  const publicBook = book.googleBook

  if (!publicBook) {
    return
  }

  form.title = publicBook.title

  if (publicBook.description) {
    form.comment = publicBook.description
  }

  if (publicBook.publishedDate) {
    const parsedDate = new Date(publicBook.publishedDate)
    if (!Number.isNaN(parsedDate.getTime())) {
      form.readAt = parsedDate.toISOString().slice(0, 10)
    }
  }

  if (publicBook.cover && !coverFile.value) {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(publicBook.cover)}`
    fetch(proxyUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
        coverFile.value = file
        coverPreview.value = publicBook.cover || null
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
    errors.value.title = 'Название обязательно'
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

    if (coreBookForm.genre) {
      formData.append('genre', coreBookForm.genre)
    }

    if (coreBookForm.pageCount) {
      formData.append('pageCount', coreBookForm.pageCount.toString())
    }

    if (coreBookForm.publishYear) {
      formData.append('publishYear', coreBookForm.publishYear.toString())
    }

    await request(`/user-books`, {
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
