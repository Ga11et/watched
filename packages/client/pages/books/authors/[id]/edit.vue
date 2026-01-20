<template>
  <div class="mx-auto max-w-2xl">
    <Breadcrumbs :items="breadcrumbItems" />

    <div v-if="loading" class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
      ></div>
    </div>

    <div v-else-if="error" class="text-center py-8">
      <div class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {{ error }}
      </div>
    </div>

    <div v-else-if="author" class="bg-white shadow rounded-lg p-6">
      <h2 class="text-2xl font-bold mb-6">Редактировать автора</h2>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div
          v-if="submitError"
          class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ submitError }}
        </div>

        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
            Имя автора *
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :class="{ 'border-red-500': errors?.name }"
          />
          <p v-if="errors?.name" class="mt-1 text-sm text-red-600">
            {{ errors.name }}
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label for="country" class="block text-sm font-medium text-gray-700 mb-1"> Страна </label>
          <input
            id="country"
            v-model="form.country"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Дополнительная информация об авторе"
          ></textarea>
        </div>

        <div>
          <label for="photo" class="block text-sm font-medium text-gray-700 mb-1"> Фото </label>
          <PhotoUpload
            v-model="form.photo"
            :initial-url="author.photo"
            accept="image/*"
            class="w-full"
          />
        </div>

        <div class="flex justify-end gap-3">
          <NuxtLink
            :to="`/books/authors/${route.params.id}`"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </NuxtLink>
          <button
            type="submit"
            :disabled="submitting"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <span v-if="submitting">Сохранение...</span>
            <span v-else>Сохранить</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Author {
  id: string
  name: string
  birthYear?: number
  deathYear?: number
  country?: string
  photo?: string
  comment?: string
  createdAt: string
}

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const {
  data: author,
  loading,
  error,
} = await useFetch<Author>(`/api/authors/${route.params.id}`, {
  baseURL: config.public.apiUrl,
})

const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Книги', to: '/books' },
  { label: 'Авторы', to: '/books/authors' },
  { label: author.value?.name || 'Автор', to: `/books/authors/${route.params.id}` },
  { label: 'Редактирование' },
])

const form = ref({
  name: '',
  birthYear: undefined as number | undefined,
  deathYear: undefined as number | undefined,
  country: '',
  comment: '',
  photo: '',
})

const submitting = ref(false)
const submitError = ref('')
const errors = ref<Record<string, string> | null>(null)

// Заполняем форму данными автора при загрузке
watchEffect(() => {
  if (author.value) {
    form.value = {
      name: author.value.name,
      birthYear: author.value.birthYear,
      deathYear: author.value.deathYear,
      country: author.value.country || '',
      comment: author.value.comment || '',
      photo: author.value.photo || '',
    }
  }
})

const handleSubmit = async () => {
  submitting.value = true
  submitError.value = ''
  errors.value = null

  try {
    await $fetch(`/api/authors/${route.params.id}`, {
      baseURL: config.public.apiUrl,
      method: 'PUT',
      body: {
        name: form.value.name.trim(),
        birthYear: form.value.birthYear || undefined,
        deathYear: form.value.deathYear || undefined,
        country: form.value.country?.trim() || undefined,
        comment: form.value.comment?.trim() || undefined,
        photo: form.value.photo || undefined,
      },
    })

    await router.push(`/books/authors/${route.params.id}`)
  } catch (err: any) {
    if (err.data?.violations) {
      errors.value = {}
      err.data.violations.forEach((violation: any) => {
        errors.value![violation.field] = violation.message
      })
      submitError.value = err.data.message || 'Произошла ошибка при обновлении автора'
    } else {
      submitError.value = 'Произошла ошибка при обновлении автора'
    }
  } finally {
    submitting.value = false
  }
}
</script>
