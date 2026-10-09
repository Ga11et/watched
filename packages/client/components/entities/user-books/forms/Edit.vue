<template>
  <form class="px-6 py-6" @submit.prevent="onSubmit">
    <div v-if="loading" class="text-center py-6 text-gray-500">Загрузка...</div>

    <div
      v-else-if="loadError"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ loadError }}
    </div>

    <div v-else-if="userBook" class="space-y-6">
      <div class="flex gap-6">
        <EntitiesBooksOutputsCover :cover="userBook.book.cover" :alt="userBook.book.title" />

        <CommonFormsConfigurableFields :config="editFormLayout" class="flex-1">
          <template #bookTitle>
            <div>
              <div class="text-sm text-gray-500">Название</div>
              <div class="text-xl font-medium text-gray-900">{{ userBook.book.title }}</div>
            </div>
          </template>

          <template #author>
            <div>
              <div class="text-sm text-gray-500">Автор</div>
              <div v-if="userBook.book.authors?.length" class="mt-1 flex flex-wrap gap-2">
                <NuxtLink
                  v-for="author in userBook.book.authors"
                  :key="author.id"
                  :to="`/books/authors/${author.id}`"
                  class="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
                >
                  {{ author.fullName }}
                </NuxtLink>
              </div>
              <div v-else class="text-base text-gray-900">—</div>
            </div>
          </template>

          <template #genre>
            <div>
              <div class="text-sm text-gray-500">Жанр</div>
              <div class="text-base text-gray-900">{{ userBook.book.genre ?? '—' }}</div>
            </div>
          </template>

          <template #publishYear>
            <div>
              <div class="text-sm text-gray-500">Год издания</div>
              <div class="text-base text-gray-900">{{ userBook.book.publishYear ?? '—' }}</div>
            </div>
          </template>

          <template #pageCount>
            <div>
              <div class="text-sm text-gray-500">Количество страниц</div>
              <div class="text-base text-gray-900">{{ userBook.book.pageCount ?? '—' }}</div>
            </div>
          </template>

          <template #createdAt>
            <div>
              <div class="tracking-wide text-sm text-gray-500">Создана карточка книги</div>
              <div class="m-0 text-gray-900"><UiDateDisplay :date="userBook.createdAt" /></div>
            </div>
          </template>

          <template #updatedAt>
            <div>
              <div class="tracking-wide text-sm text-gray-500">Обновлена карточка книги</div>
              <div class="m-0 text-gray-900"><UiDateDisplay :date="userBook.updatedAt" /></div>
            </div>
          </template>

          <template #rating>
            <EntitiesUserBooksInputsRating
              v-model="form.rating"
              :error="errors.rating"
              :disabled="isFormDisabled"
            />
          </template>

          <template #readAt>
            <EntitiesUserBooksInputsReadAt
              v-model="form.readAt"
              :error="errors.readAt"
              :disabled="isFormDisabled"
            />
          </template>

          <template #comment>
            <EntitiesUserBooksInputsComment
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
          :to="`/user-books/${userBookId}`"
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
import type { UserBook } from '~/types/api'

interface FormFieldConfig {
  id: string
}

interface FormRowConfig {
  columns?: number
  fields: FormFieldConfig[]
}

interface Props {
  userBookId: string
}

interface UpdateForm {
  comment?: string
  readAt?: string
  rating?: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'title-loaded': [title: string]
}>()

const router = useRouter()
const route = useRoute()
const { request } = useApiRequest()

const { data: userBook, pending: loading } = useAsyncData(
  `user-book-edit-${route.params.id}`,
  async () => {
    return request<UserBook>(`/user-books/${route.params.id}`)
  },
  { server: false },
)

watch(userBook, (book) => {
  if (book?.book?.title) emit('title-loaded', book.book.title)

  if (book?.rating) form.rating = book.rating
  if (book?.readAt) form.readAt = String(book.readAt).slice(0, 10)
  if (book?.comment) form.comment = book.comment
})

const submitting = ref(false)
const loadError = ref('')
const error = ref('')
const errors = ref<Record<string, string>>({})

const isFormDisabled = computed(() => loading.value || submitting.value)

const form = reactive<UpdateForm>({
  rating: undefined,
  readAt: undefined,
  comment: undefined,
})

const editFormLayout: FormRowConfig[] = [
  { columns: 1, fields: [{ id: 'bookTitle' }] },
  { columns: 2, fields: [{ id: 'author' }, { id: 'genre' }] },
  { columns: 2, fields: [{ id: 'publishYear' }, { id: 'pageCount' }] },
  {
    columns: 2,
    fields: [{ id: 'rating' }, { id: 'readAt' }],
  },
  {
    columns: 1,
    fields: [{ id: 'comment' }],
  },
  { columns: 2, fields: [{ id: 'createdAt' }, { id: 'updatedAt' }] },
]

const onSubmit = async () => {
  if (isFormDisabled.value) return

  submitting.value = true
  error.value = ''
  errors.value = {}

  try {
    const body: UpdateForm = {}

    body['rating'] = form.rating
    body['readAt'] = form.readAt
    body['comment'] = form.comment?.trim()

    await request(`/user-books/${props.userBookId}`, {
      method: 'PUT',
      body,
    })

    await router.push(`/user-books/${props.userBookId}`)
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
