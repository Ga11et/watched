<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Игры', to: '/games' },
        { label: 'Добавление' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить игру</h1>
          <p class="mt-1 text-sm text-gray-500">
            Заполните поля ниже, чтобы создать новую запись об игре.
          </p>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="flex gap-6">
          <UiPhotoUpload
            v-model="coverFile"
            v-model:preview="coverPreview"
            label="Обложка"
            :error="errors.cover"
            class="flex-shrink-0"
          />

          <div class="flex-1 space-y-6">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700"
                >Название<span class="text-red-500">*</span></label
              >
              <IntegrationsGamesAutocomplete
                id="title"
                v-model="selectedGame"
                v-model:manual-query="form.title"
                placeholder="Найти игру..."
                :error="errors?.title"
                @select="onGameSelect"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="completionDate" class="block text-sm font-medium text-gray-700"
                  >Дата прохождения</label
                >
                <input
                  id="completionDate"
                  v-model="form.completionDate"
                  type="date"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <p class="mt-1 text-xs text-gray-500">Когда вы прошли эту игру?</p>
              </div>
              <div>
                <label for="playTimeHours" class="block text-sm font-medium text-gray-700"
                  >Время в игре (часы)</label
                >
                <div class="mt-1 relative">
                  <input
                    id="playTimeHours"
                    v-model.number="form.playTimeHours"
                    type="number"
                    min="0"
                    step="0.5"
                    class="block w-full rounded-lg border border-gray-300 pl-3 pr-12 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="например, 12.5"
                  />
                  <span
                    class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400"
                    >ч</span
                  >
                </div>
                <p class="mt-1 text-xs text-gray-500">Примерное общее время в игре.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="rating" class="block text-sm font-medium text-gray-700"
                  >Оценка (1-100)</label
                >
                <input
                  id="rating"
                  v-model.number="form.rating"
                  type="number"
                  min="1"
                  max="100"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="например, 85"
                />
                <p class="mt-1 text-xs text-gray-500">Ваша личная оценка игры.</p>
              </div>
              <div>
                <label for="comment" class="block text-sm font-medium text-gray-700"
                  >Комментарий</label
                >
                <textarea
                  id="comment"
                  v-model="form.comment"
                  rows="4"
                  class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="Ваши мысли об игре"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Необязательно. Поделитесь яркими моментами, плюсами/минусами или впечатлениями.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="error"
          class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 mt-3"
        >
          {{ error }}
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink
            to="/games"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IGDBGame } from '~/components/integrations/igdb-games.service'

const router = useRouter()
const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})
const hydrated = ref(false)

const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)
const selectedGame = ref<IGDBGame | null>(null)

onMounted(() => {
  hydrated.value = true
})

const form = reactive({
  title: '',
  completionDate: new Date().toISOString().slice(0, 10),
  playTimeHours: undefined as number | undefined,
  comment: '',
  rating: undefined as number | undefined,
})

const onGameSelect = (game: IGDBGame) => {
  form.title = game.name

  if (game.summary) {
    form.comment = game.summary
  }

  if (game.releaseDate) {
    const year = parseInt(game.releaseDate)
    if (!isNaN(year) && year > 1980 && year <= new Date().getFullYear()) {
      form.completionDate = game.releaseDate
    }
  }

  if (game.cover && !coverFile.value) {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(game.cover)}`
    fetch(proxyUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
        coverFile.value = file
        coverPreview.value = game.cover || null
      })
      .catch((error) => {
        console.warn('Failed to fetch game cover:', error)
      })
  }
}

const onSubmit = async () => {
  error.value = ''
  errors.value = {}
  if (!form.title.trim()) {
    errors.value.title = 'Название обязательно'
    return
  }
  if (form.title.length > 200) {
    errors.value.title = 'Название слишком длинное'
    return
  }
  submitting.value = true
  try {
    const config = useRuntimeConfig()
    const formData = new FormData()

    formData.append('title', form.title.trim())

    if (form.completionDate) {
      formData.append('completionDate', form.completionDate)
    }

    if (typeof form.playTimeHours === 'number') {
      formData.append('playTimeHours', form.playTimeHours.toString())
    }

    if (typeof form.rating === 'number') {
      formData.append('rating', form.rating.toString())
    }

    if (form.comment?.trim()) {
      formData.append('comment', form.comment.trim())
    }

    if (coverFile.value) {
      formData.append('cover', coverFile.value)
    }

    await $fetch(`${config.public.apiBase}/games`, {
      method: 'POST',
      body: formData,
    })

    router.push('/')
  } catch (e: any) {
    const base = e?.data?.message || e?.message || 'Не удалось создать игру'
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
