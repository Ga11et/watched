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

      <TmdbPersonCard
        v-if="person"
        :person="person"
        title="Выбранный режиссёр (TMDB)"
        class="mx-6"
      />

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="flex gap-6">
          <PhotoUpload
            v-model="photoFile"
            v-model:preview="photoPreview"
            label="Фото"
            :error="errors.photo"
            class="flex-shrink-0"
          />

          <div class="flex-1 grid grid-cols-1 gap-6">
            <TmdbPersonSearch
              v-model="person"
              v-model:manual-query="manualName"
              label="ФИО"
              :required="true"
              :error="errors.fullName"
              placeholder="например, Кристофер Нолан"
              id="fullName"
            />
            <p class="-mt-4 text-xs text-gray-500">Выберите из подсказок или введите имя вручную</p>

            <div>
              <label for="comment" class="block text-sm font-medium text-gray-700"
                >Комментарий</label
              >
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
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink
            :to="String($route.query.redirectTo) || '/movies/directors'"
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
import type { TmdbPerson } from '~/components/TmdbPersonSearch.vue'

const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

const form = ref({
  comment: '',
})

const person = ref<TmdbPerson | null>(null)
const manualName = ref('')
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

watch(person, async (newPerson) => {
  if (newPerson?.profile_path) {
    const url = `https://image.tmdb.org/t/p/w500${newPerson.profile_path}`
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      photoFile.value = new File([blob], `${newPerson.id}.jpg`, { type: blob.type })
      photoPreview.value = url
    } catch (e) {
      console.error('Failed to fetch TMDB photo:', e)
    }
  }
})

const onSubmit = async () => {
  if (submitting.value) return

  try {
    submitting.value = true
    errors.value = {}
    error.value = ''

    const fullName = person.value?.name || manualName.value.trim()
    if (!fullName) {
      errors.value.fullName = 'Укажите ФИО режиссёра'
      return
    }

    const config = useRuntimeConfig()
    const formData = new FormData()
    formData.append('fullName', fullName)
    if (form.value.comment?.trim()) {
      formData.append('comment', form.value.comment.trim())
    }
    if (photoFile.value) {
      formData.append('photo', photoFile.value)
    }

    await $fetch(`${config.public.apiBase}/directors`, {
      method: 'POST',
      body: formData,
    })

    const route = useRoute()
    const redirectTo = route.query.redirectTo as string
    navigateTo(redirectTo || '/movies/directors')
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
