<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Игры', to: '/games' },
        { label: 'Издатели', to: '/games/publishers' },
        { label: publisher?.fullName || 'Загрузка...', to: `/games/publishers/${route.params.id}` },
        { label: 'Редактирование' },
      ]"
    />

    <div
      v-if="loadError"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ loadError }}
    </div>

    <div v-if="pending" class="text-center py-12 text-gray-500">Загрузка...</div>

    <div v-else class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать издателя</h1>
        <p class="mt-1 text-sm text-gray-500">Измените данные издателя</p>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="flex gap-6">
          <UiPhotoUpload
            v-model="photoFile"
            v-model:preview="photoPreview"
            label="Фото"
            :error="errors.photo"
            size="lg"
            class="flex-shrink-0"
          />

          <div class="flex-1 grid grid-cols-1 gap-6">
            <div>
              <label for="fullName" class="block text-sm font-medium text-gray-700">
                Имя издателя<span class="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                v-model="form.fullName"
                type="text"
                :class="[
                  'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                  errors.fullName
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
                ]"
                placeholder="например, CD Projekt"
              />
              <p v-if="errors.fullName" class="mt-1 text-sm text-red-600">{{ errors.fullName }}</p>
            </div>

            <div>
              <label for="comment" class="block text-sm font-medium text-gray-700"
                >Комментарий</label
              >
              <textarea
                id="comment"
                v-model="form.comment"
                rows="3"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Дополнительная информация об издателе"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink
            :to="`/games/publishers/${route.params.id}`"
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
            <span>{{ submitting ? 'Сохранение...' : 'Сохранить' }}</span>
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
const route = useRoute()
const config = useRuntimeConfig()

const loadError = ref('')
const error = ref('')
const errors = ref<Record<string, string>>({})
const submitting = ref(false)

interface PublisherForm {
  fullName: string
  comment: string
}

const form = ref<PublisherForm>({
  fullName: '',
  comment: '',
})

const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)

const { data: publisher, pending } = await useAsyncData(
  `publisher-edit-${route.params.id}`,
  async () => {
    try {
      loadError.value = ''
      const data = await $fetch<{
        id: string
        fullName: string
        comment?: string | null
        photo?: string | null
        createdAt: string
        updatedAt: string
      }>(`${config.public.apiBase}/publishers/${route.params.id}`)

      form.value.fullName = data.fullName || ''
      form.value.comment = data.comment || ''
      if (data.photo) {
        photoPreview.value = `${config.public.apiBase}${data.photo}`
      }

      return data
    } catch (e: any) {
      loadError.value = e?.data?.message || 'Не удалось загрузить издателя'
      return null
    }
  },
  { server: false },
)

const onSubmit = async () => {
  if (submitting.value) return

  try {
    submitting.value = true
    errors.value = {}
    error.value = ''

    const fullName = form.value.fullName.trim()
    if (!fullName) {
      errors.value.fullName = 'Имя издателя обязательно'
      return
    }

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('comment', form.value.comment.trim())
    if (photoFile.value) {
      formData.append('photo', photoFile.value)
    } else if (publisher.value?.photo && !photoPreview.value) {
      formData.append('removePhoto', 'true')
    }

    await $fetch(`${config.public.apiBase}/publishers/${route.params.id}`, {
      method: 'PUT',
      body: formData,
    })

    navigateTo(`/games/publishers/${route.params.id}`)
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
    error.value = base ?? 'Произошла ошибка при обновлении издателя'
  } finally {
    submitting.value = false
  }
}
</script>
