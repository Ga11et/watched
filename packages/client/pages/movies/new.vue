<template>
  <div class="mx-auto max-w-7xl">
    <Breadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Фильмы', to: '/movies' },
        { label: 'Добавление' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить фильм</h1>
          <p class="mt-1 text-sm text-gray-500">Заполните поля ниже, чтобы добавить новый фильм</p>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="grid grid-cols-1 gap-6">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700"
              >Название<span class="text-red-500">*</span></label
            >
            <input
              id="title"
              v-model.trim="form.title"
              type="text"
              :class="[
                'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                errors.title
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
              ]"
              placeholder="например, Интерстеллар"
            />
            <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
          </div>

          <div>
            <label for="director" class="block text-sm font-medium text-gray-700">Режиссёр</label>
            <div class="flex gap-2">
              <select
                id="director"
                v-model="form.directorId"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">Выберите режиссёра</option>
                <option v-for="director in directors" :key="director.id" :value="director.id">
                  {{ director.fullName }}
                </option>
              </select>
              <button
                type="button"
                @click="showAddDirector = true"
                class="mt-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                +
              </button>
            </div>
            <p v-if="errors.directorId" class="mt-1 text-sm text-red-600">
              {{ errors.directorId }}
            </p>
          </div>

          <div>
            <label for="watchDate" class="block text-sm font-medium text-gray-700"
              >Дата просмотра<span class="text-red-500">*</span></label
            >
            <input
              id="watchDate"
              v-model="form.watchDate"
              type="date"
              :class="[
                'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                errors.watchDate
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
              ]"
            />
            <p v-if="errors.watchDate" class="mt-1 text-sm text-red-600">
              {{ errors.watchDate }}
            </p>
          </div>

          <div>
            <label for="rating" class="block text-sm font-medium text-gray-700"
              >Оценка (0-100)</label
            >
            <input
              id="rating"
              v-model.number="form.rating"
              type="number"
              min="0"
              max="100"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <p v-if="errors.rating" class="mt-1 text-sm text-red-600">{{ errors.rating }}</p>
          </div>

          <div>
            <label for="comment" class="block text-sm font-medium text-gray-700">Комментарий</label>
            <textarea
              id="comment"
              v-model="form.comment"
              rows="3"
              :class="[
                'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                errors.comment
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
              ]"
              placeholder="Ваши впечатления от фильма"
            ></textarea>
            <p v-if="errors.comment" class="mt-1 text-sm text-red-600">{{ errors.comment }}</p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink
            to="/movies"
            class="rounded-lg px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Отмена
          </NuxtLink>
          <button
            type="submit"
            :disabled="submitting"
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
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span>{{ submitting ? 'Сохранение...' : 'Создать' }}</span>
          </button>
        </div>

        <div
          v-if="error"
          class="mt-6 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ error }}
        </div>
      </form>
    </div>

    <dialog v-if="showAddDirector" class="rounded-lg shadow-xl">
      <form @submit.prevent="handleAddDirector" class="w-full max-w-2xl p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold">Добавить режиссёра</h2>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-500"
            @click="showAddDirector = false"
          >
            ✕
          </button>
        </div>

        <div class="grid grid-cols-1 gap-6">
          <div>
            <label for="directorName" class="block text-sm font-medium text-gray-700"
              >ФИО<span class="text-red-500">*</span></label
            >
            <input
              id="directorName"
              v-model="newDirector.fullName"
              type="text"
              required
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label for="directorComment" class="block text-sm font-medium text-gray-700"
              >Комментарий</label
            >
            <textarea
              id="directorComment"
              v-model="newDirector.comment"
              rows="3"
              class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            ></textarea>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            @click="showAddDirector = false"
          >
            Отмена
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Сохранить
          </button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const showAddDirector = ref(false)
const directors = ref([])

const today = new Date().toISOString().split('T')[0]

interface MovieForm {
  title: string
  directorId: string | null
  watchDate: string
  rating: number | null
  comment: string
}

const form = ref<MovieForm>({
  title: '',
  directorId: null,
  watchDate: today,
  rating: null,
  comment: '',
})

const newDirector = ref({
  fullName: '',
  comment: '',
})

const handleAddDirector = async () => {
  try {
    // TODO: Implement API call to save director
    showAddDirector.value = false
    // TODO: Refresh directors list
  } catch (e) {
    error.value = e.message || 'Произошла ошибка при сохранении режиссёра'
  }
}

const onSubmit = async () => {
  if (submitting.value) return

  try {
    submitting.value = true
    errors.value = {}
    error.value = ''

    // TODO: Implement API call to save movie

    navigateTo('/movies')
  } catch (e) {
    const base = e.data?.message
    const violations = e.data?.violations

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

// TODO: Load directors list on page load
</script>

<style>
dialog {
  border: none;
  padding: 0;
  background: white;
}

dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}
</style>
