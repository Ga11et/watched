<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs :items="breadcrumbItems" />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить автора</h1>
          <p class="mt-1 text-sm text-gray-500">
            Заполните поля ниже, чтобы добавить нового автора
          </p>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="flex gap-6">
          <UiPhotoUpload
            v-model="photoFile"
            v-model:preview="photoPreview"
            label="Фото"
            :error="errors.photo"
            class="flex-shrink-0"
          />

          <div class="flex-1 grid grid-cols-1 gap-6">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                Имя автора *
              </label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                :class="{ 'border-red-300 focus:ring-red-200': errors?.name }"
              />
              <p v-if="errors?.name" class="mt-1 text-sm text-red-600">
                {{ errors.name }}
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="birthYear" class="block text-sm font-medium text-gray-700 mb-1">
                  Год рождения
                </label>
                <input
                  id="birthYear"
                  v-model.number="form.birthYear"
                  type="number"
                  min="1000"
                  :max="new Date().getFullYear()"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label for="deathYear" class="block text-sm font-medium text-gray-700 mb-1">
                  Год смерти
                </label>
                <input
                  id="deathYear"
                  v-model.number="form.deathYear"
                  type="number"
                  min="1000"
                  :max="new Date().getFullYear()"
                  class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div>
              <label for="country" class="block text-sm font-medium text-gray-700 mb-1">
                Страна
              </label>
              <input
                id="country"
                v-model="form.country"
                type="text"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="например: Россия, США, Великобритания"
              />
            </div>

            <div>
              <label for="comment" class="block text-sm font-medium text-gray-700 mb-1">
                Комментарий
              </label>
              <textarea
                id="comment"
                v-model="form.comment"
                rows="3"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Дополнительная информация об авторе"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink
            to="/books/authors"
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

// Вычисляемые свойства
const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Книги', to: '/books' },
  { label: 'Авторы', to: '/books/authors' },
  { label: 'Новый автор' },
])

// Данные формы
const form = reactive({
  name: '',
  birthYear: undefined as number | undefined,
  deathYear: undefined as number | undefined,
  country: '',
  comment: '',
})

// Валидация
const validateForm = () => {
  errors.value = {}

  if (!form.name.trim()) {
    errors.value.name = 'Имя автора обязательно'
    throw new Error('Validation failed')
  }

  if (form.name.length > 200) {
    errors.value.name = 'Имя слишком длинное'
    throw new Error('Validation failed')
  }
}

// Подготовка payload
const preparePayload = () => {
  const formData = new FormData()

  formData.append('name', form.name.trim())

  if (form.birthYear) {
    formData.append('birthYear', form.birthYear.toString())
  }

  if (form.deathYear) {
    formData.append('deathYear', form.deathYear.toString())
  }

  if (form.country?.trim()) {
    formData.append('country', form.country.trim())
  }

  if (form.comment?.trim()) {
    formData.append('comment', form.comment.trim())
  }

  if (photoFile.value) {
    formData.append('photo', photoFile.value)
  }

  return formData
}

// Обработка ошибок
const handleErrors = (e: any) => {
  const base = e?.data?.message || e?.message || 'Произошла ошибка при создании автора'
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

    await $fetch(`${config.public.apiBase}/authors`, {
      method: 'POST',
      body: payload,
    })

    await router.push('/books/authors')
  } catch (e: any) {
    handleErrors(e)
  } finally {
    submitting.value = false
  }
}
</script>
