<template>
  <div class="mx-auto max-w-7xl">
    <Breadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Фильмы', to: '/movies' },
        { label: 'Режиссёры', to: '/movies/directors' },
        { label: 'Добавление' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить режиссёра</h1>
          <p class="mt-1 text-sm text-gray-500">
            Заполните поля ниже, чтобы добавить нового режиссёра
          </p>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="grid grid-cols-1 gap-6">
          <div>
            <label for="fullName" class="block text-sm font-medium text-gray-700"
              >ФИО<span class="text-red-500">*</span></label
            >
            <input
              id="fullName"
              v-model.trim="form.fullName"
              type="text"
              :class="[
                'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                errors.fullName
                  ? 'border-red-300 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
              ]"
              placeholder="например, Кристофер Нолан"
            />
            <p v-if="errors.fullName" class="mt-1 text-sm text-red-600">{{ errors.fullName }}</p>
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
              placeholder="Дополнительная информация о режиссёре"
            ></textarea>
            <p v-if="errors.comment" class="mt-1 text-sm text-red-600">{{ errors.comment }}</p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink
            to="/movies/directors"
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
  </div>
</template>

<script setup lang="ts">
const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const form = ref({
  fullName: '',
  comment: '',
})

const onSubmit = async () => {
  if (submitting.value) return

  try {
    submitting.value = true
    errors.value = {}
    error.value = ''

    // TODO: Implement API call to save director

    navigateTo('/movies/directors')
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
    error.value = base ?? 'Произошла ошибка при создании режиссёра'
  } finally {
    submitting.value = false
  }
}
</script>
