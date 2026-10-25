<script setup lang="ts">
import type { User, UserDeletionSummary } from '~/types/api'

const props = defineProps<{ user: User }>()

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  deleted: []
}>()

const { remove, getDeletionSummary } = useUsers()

const summary = ref<UserDeletionSummary | null>(null)
const summaryPending = ref(false)
const summaryError = ref('')
const deleting = ref(false)
const deleteError = ref('')

const loadSummary = async () => {
  summaryPending.value = true
  summaryError.value = ''
  summary.value = null

  try {
    summary.value = await getDeletionSummary(props.user.id)
  } catch (error) {
    summaryError.value = parseRequestError(error).message
  } finally {
    summaryPending.value = false
  }
}

watch(open, (value) => {
  if (!value) return

  deleteError.value = ''
  void loadSummary()
})

const confirmDelete = async () => {
  if (!summary.value || summaryPending.value || deleting.value) return

  deleting.value = true
  deleteError.value = ''

  try {
    await remove(props.user.id)
    emit('deleted')
  } catch (error) {
    deleteError.value = parseRequestError(error).message
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <UiDialog
    v-model:open="open"
    :title="`Удалить пользователя ${user.name}?`"
    :dismissible="!deleting"
  >
    <div class="space-y-3 text-sm text-gray-700">
      <p v-if="summaryPending" role="status" class="text-gray-500">Загрузка сводки...</p>

      <div
        v-else-if="summaryError"
        role="alert"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        <p>{{ summaryError }}</p>
        <button
          type="button"
          class="mt-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          @click="loadSummary"
        >
          Повторить
        </button>
      </div>

      <template v-else-if="summary">
        <p>Будут удалены записи списков:</p>
        <ul class="list-disc space-y-1 pl-5">
          <li>Книги — {{ summary.books }}</li>
          <li>Фильмы — {{ summary.movies }}</li>
          <li>Сериалы — {{ summary.series }}</li>
          <li>Игры — {{ summary.games }}</li>
        </ul>
        <p>Книги, фильмы, сериалы и игры в каталоге сохранятся.</p>
        <p>Действие необратимо. Если нужно лишь закрыть доступ, деактивируйте пользователя.</p>
      </template>

      <p
        v-if="deleteError"
        role="alert"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ deleteError }}
      </p>
    </div>

    <template #actions>
      <button
        type="button"
        :disabled="deleting"
        class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        @click="open = false"
      >
        Отмена
      </button>
      <button
        type="button"
        :disabled="!summary || summaryPending || deleting"
        class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        @click="confirmDelete"
      >
        {{ deleting ? 'Удаление...' : 'Удалить' }}
      </button>
    </template>
  </UiDialog>
</template>
