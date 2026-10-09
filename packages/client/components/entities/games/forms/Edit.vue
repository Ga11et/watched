<template>
  <form class="px-6 py-6" @submit.prevent="onSubmit">
    <div class="flex gap-6">
      <UiPhotoUpload
        v-model="coverFile"
        v-model:preview="coverPreview"
        label="Обложка"
        :error="errors.cover"
        :disabled="isFormDisabled"
        class="flex-shrink-0"
      />

      <CommonFormsConfigurableFields :config="gameFormLayout" class="flex-1">
        <template #title>
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700"
              >Название<span class="text-red-500">*</span></label
            >
            <div :class="isFormDisabled ? 'pointer-events-none opacity-60' : ''">
              <IntegrationsGamesAutocomplete
                id="title"
                v-model="selectedGame"
                v-model:manual-query="form.title"
                placeholder="Найти игру..."
                :error="errors.title"
                @select="onGameSelect"
              />
            </div>
          </div>
        </template>

        <template #completionDate>
          <EntitiesGamesInputsCompletionDate
            v-model="form.completionDate"
            :error="errors.completionDate"
            :disabled="isFormDisabled"
          />
        </template>

        <template #playTimeHours>
          <EntitiesGamesInputsPlayTimeHours
            v-model="form.playTimeHours"
            :error="errors.playTimeHours"
            :disabled="isFormDisabled"
          />
        </template>

        <template #rating>
          <EntitiesGamesInputsRating
            v-model="form.rating"
            :error="errors.rating"
            :disabled="isFormDisabled"
          />
        </template>

        <template #developers>
          <EntitiesGamesInputsDevelopers
            v-model="form.developerIds"
            :error="errors.developerIds"
            :disabled="isFormDisabled"
          />
        </template>

        <template #publishers>
          <EntitiesGamesInputsPublishers
            v-model="form.publisherIds"
            :error="errors.publisherIds"
            :disabled="isFormDisabled"
          />
        </template>

        <template #comment>
          <EntitiesGamesInputsComment
            v-model="form.comment"
            :error="errors.comment"
            :disabled="isFormDisabled"
          />
        </template>
      </CommonFormsConfigurableFields>
    </div>

    <div
      v-if="error"
      class="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div class="mt-6 flex items-center justify-end gap-3">
      <NuxtLink
        :to="`/games/${gameId}`"
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
  </form>
</template>

<script setup lang="ts">
import type { IGDBGame } from '~/components/integrations/igdb-games.service'

interface NamedEntity {
  id: string
}

interface GameApiResponse {
  id: string
  title: string
  completionDate: string | null
  playTimeHours: number | null
  comment: string | null
  rating: number | null
  cover: string | null
  developers?: NamedEntity[]
  publishers?: NamedEntity[]
}

interface FormFieldConfig {
  id: string
}

interface FormRowConfig {
  columns?: number
  fields: FormFieldConfig[]
}

interface Props {
  gameId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'title-loaded': [title: string]
}>()

const router = useRouter()
const { request } = useApiRequest()
const config = useRuntimeConfig()

const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})

const isFormDisabled = computed(() => loading.value || submitting.value)

const coverFile = ref<File | null>(null)
const coverPreview = ref<string | null>(null)
const selectedGame = ref<IGDBGame | null>(null)

const form = reactive({
  title: '',
  completionDate: '',
  playTimeHours: undefined as number | undefined,
  comment: '',
  rating: undefined as number | undefined,
  developerIds: [] as string[],
  publisherIds: [] as string[],
})

const gameFormLayout: FormRowConfig[] = [
  {
    columns: 1,
    fields: [{ id: 'title' }],
  },
  {
    columns: 1,
    fields: [{ id: 'completionDate' }],
  },
  {
    columns: 2,
    fields: [{ id: 'playTimeHours' }, { id: 'rating' }],
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

  if (game.cover) {
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

const loadGame = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await request<GameApiResponse>(`/games/${props.gameId}`)
    form.title = data.title || ''
    form.completionDate = data.completionDate ? String(data.completionDate).slice(0, 10) : ''
    form.playTimeHours = typeof data.playTimeHours === 'number' ? data.playTimeHours : undefined
    form.comment = data.comment || ''
    form.rating = typeof data.rating === 'number' ? data.rating : undefined
    form.developerIds = data.developers?.map((developer) => developer.id) ?? []
    form.publisherIds = data.publishers?.map((publisher) => publisher.id) ?? []

    if (data.cover) {
      coverPreview.value = data.cover.startsWith('http')
        ? data.cover
        : `${config.public.apiBase}${data.cover}`
    }

    emit('title-loaded', form.title)
  } catch (e: unknown) {
    const err = e as { message?: string; data?: { message?: string } }
    error.value = err?.data?.message || err?.message || 'Не удалось загрузить игру'
  } finally {
    loading.value = false
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
    const formData = new FormData()

    formData.append('title', form.title.trim())

    if (form.completionDate) {
      formData.append('completionDate', form.completionDate)
    }

    if (typeof form.playTimeHours === 'number' && !Number.isNaN(form.playTimeHours)) {
      formData.append('playTimeHours', form.playTimeHours.toString())
    }

    if (typeof form.rating === 'number' && !Number.isNaN(form.rating)) {
      formData.append('rating', form.rating.toString())
    }

    if (form.developerIds.length === 0) {
      formData.append('developerIds', '')
    } else {
      form.developerIds.forEach((developerId) => {
        formData.append('developerIds', developerId)
      })
    }

    if (form.publisherIds.length === 0) {
      formData.append('publisherIds', '')
    } else {
      form.publisherIds.forEach((publisherId) => {
        formData.append('publisherIds', publisherId)
      })
    }

    if (form.comment?.trim()) {
      formData.append('comment', form.comment.trim())
    }

    if (coverFile.value) {
      formData.append('cover', coverFile.value)
    } else if (!coverPreview.value) {
      formData.append('removeCover', 'true')
    }

    await request(`/games/${props.gameId}`, {
      method: 'PUT',
      body: formData,
    })

    router.push(`/games/${props.gameId}`)
  } catch (e: unknown) {
    const err = e as {
      message?: string
      data?: { message?: string; violations?: Array<{ field: string; message: string }> }
    }
    const base = err?.data?.message || err?.message || 'Не удалось сохранить изменения'
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

onMounted(loadGame)
</script>
