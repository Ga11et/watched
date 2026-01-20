<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs :items="breadcrumbItems" />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить книгу</h1>
          <p class="mt-1 text-sm text-gray-500">Заполните поля ниже, чтобы добавить новую книгу</p>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="flex gap-6">
          <UiPhotoUpload
            v-model="photoFile"
            v-model:preview="photoPreview"
            label="Обложка"
            :error="errors.cover"
            class="flex-shrink-0"
          />

          <div class="flex-1 grid grid-cols-1 gap-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
                  Название книги *
                </label>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  required
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  :class="{ 'border-red-300 focus:ring-red-200': errors?.title }"
                />
                <p v-if="errors?.title" class="mt-1 text-sm text-red-600">
                  {{ errors.title }}
                </p>
              </div>

              <div>
                <label for="author" class="block text-sm font-medium text-gray-700 mb-1">
                  Автор
                </label>
                <UiSelect
                  id="author"
                  v-model="form.authorId"
                  :options="authorOptions"
                  placeholder="Выберите автора"
                  class="flex-1"
                  :error="errors?.authorId"
                />
                <p v-if="errors?.authorId" class="mt-1 text-sm text-red-600">
                  {{ errors.authorId }}
                </p>
              </div>
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                id="description"
                v-model="form.description"
                rows="4"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              ></textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label for="publishedYear" class="block text-sm font-medium text-gray-700 mb-1">
                  Год издания
                </label>
                <input
                  id="publishedYear"
                  v-model.number="form.publishedYear"
                  type="number"
                  min="1000"
                  :max="new Date().getFullYear()"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label for="pages" class="block text-sm font-medium text-gray-700 mb-1">
                  Количество страниц
                </label>
                <input
                  id="pages"
                  v-model.number="form.pages"
                  type="number"
                  min="1"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label for="genre" class="block text-sm font-medium text-gray-700 mb-1">
                  Жанр
                </label>
                <input
                  id="genre"
                  v-model="form.genre"
                  type="text"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="например: Фантастика, Детектив, Роман"
                />
              </div>
            </div>
          </div>
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

        <div
          v-if="error"
          class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ error }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Author {
  id: string
  name: string
}

// Конфигурация
const config = useRuntimeConfig()
const router = useRouter()

// Состояние
const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

// Файлы и превью
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

// 3. Загрузка данных
const { data: authors } = await useFetch<Author[]>(`${useRuntimeConfig().public.apiBase}/authors`)

// Вычисляемые свойства
const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Книги', to: '/books' },
  { label: 'Новая книга' },
])

const authorOptions = computed(() => [
  { value: '', label: 'Выберите автора' },
  ...(authors.value || []).map((author) => ({
    value: author.id,
    label: author.name,
  })),
])

// Данные формы
const form = reactive({
  title: '',
  authorId: '',
  description: '',
  publishedYear: undefined as number | undefined,
  pages: undefined as number | undefined,
  genre: '',
})

// Валидация
const validateForm = () => {
  errors.value = {}

  if (!form.title.trim()) {
    errors.value.title = 'Название книги обязательно'
    throw new Error('Validation failed')
  }

  if (form.title.length > 200) {
    errors.value.title = 'Название слишком длинное'
    throw new Error('Validation failed')
  }
}

// Подготовка payload
const preparePayload = () => {
  const formData = new FormData()

  formData.append('title', form.title.trim())

  if (form.authorId) {
    formData.append('authorId', form.authorId)
  }

  if (form.description?.trim()) {
    formData.append('description', form.description.trim())
  }

  if (form.publishedYear) {
    formData.append('publishedYear', form.publishedYear.toString())
  }

  if (form.pages) {
    formData.append('pages', form.pages.toString())
  }

  if (form.genre?.trim()) {
    formData.append('genre', form.genre.trim())
  }

  if (photoFile.value) {
    formData.append('cover', photoFile.value)
  }

  return formData
}

// Обработка ошибок
const handleErrors = (e: any) => {
  const base = e?.data?.message || e?.message || 'Произошла ошибка при создании книги'
  const violations = e?.data?.violations

  if (Array.isArray(violations) && violations.length) {
    violations.forEach((v) => {
      errors.value[v.field] = v.message
    })
  }
  error.value = base
}

// Отправка формы
const onSubmit = async () => {
  if (submitting.value) return

  submitting.value = true
  errors.value = {}
  error.value = ''

  try {
    validateForm()

    const payload = preparePayload()

    await $fetch(`${config.public.apiBase}/books`, {
      method: 'POST',
      body: payload,
    })

    await router.push('/books')
  } catch (e: any) {
    handleErrors(e)
  } finally {
    submitting.value = false
  }
}
</script>
