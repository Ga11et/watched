<template>
  <form @submit.prevent="onSubmit" class="px-6 py-6">
    <div class="flex gap-6">
      <UiPhotoUpload
        v-model="coverFile"
        v-model:preview="coverPreview"
        label="Обложка"
        :error="errors.cover"
        class="flex-shrink-0"
      />

      <CommonFormsConfigurableFields :config="gameFormLayout" class="flex-1">
        <template #title>
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
        </template>

        <template #playTimeHours>
          <EntitiesGamesInputsPlayTimeHours
            v-model="form.playTimeHours"
            :error="errors.playTimeHours"
          />
        </template>

        <template #rating>
          <EntitiesGamesInputsRating v-model="form.rating" :error="errors.rating" />
        </template>

        <template #completionDate>
          <EntitiesGamesInputsCompletionDate
            v-model="form.completionDate"
            :error="errors.completionDate"
          />
        </template>

        <template #developers>
          <EntitiesGamesInputsDevelopers v-model="form.developerIds" :error="errors.developerIds" />
        </template>

        <template #publishers>
          <EntitiesGamesInputsPublishers v-model="form.publisherIds" :error="errors.publisherIds" />
        </template>

        <template #comment>
          <EntitiesGamesInputsComment v-model="form.comment" :error="errors.comment" />
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
</template>

<script setup lang="ts">
import type { IGDBGame } from '~/components/integrations/igdb-games.service'

const router = useRouter()
const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)
const selectedGame = ref<IGDBGame | null>(null)

const form = reactive({
  title: '',
  completionDate: new Date().toISOString().slice(0, 10),
  playTimeHours: undefined as number | undefined,
  developerIds: [] as string[],
  publisherIds: [] as string[],
  comment: '',
  rating: undefined as number | undefined,
})

const gameFormLayout = [
  {
    columns: 1,
    fields: [{ id: 'title' }],
  },
  {
    columns: 2,
    fields: [{ id: 'playTimeHours' }, { id: 'rating' }],
  },
  {
    columns: 2,
    fields: [{ id: 'completionDate' }],
  },
  {
    columns: 2,
    fields: [{ id: 'developers' }, { id: 'publishers' }],
  },
  {
    columns: 1,
    fields: [{ id: 'comment' }],
  },
]

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
      .catch((fetchError) => {
        console.warn('Failed to fetch game cover:', fetchError)
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

    form.developerIds.forEach((developerId) => {
      formData.append('developerIds', developerId)
    })

    form.publisherIds.forEach((publisherId) => {
      formData.append('publisherIds', publisherId)
    })

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
