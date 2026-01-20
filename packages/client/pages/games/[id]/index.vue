<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Игры', to: '/games' },
        { label: game?.title || 'Загрузка...' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">
            {{ game?.title || 'Игра' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500" v-if="game">Детали игры</p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/games/${route.params.id}/edit`"
            class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-white shadow-sm transition hover:bg-indigo-700"
          >
            Редактировать
          </NuxtLink>
          <button
            @click="onDelete"
            :disabled="deleting"
            class="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg
              v-if="deleting"
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
            <span>Удалить</span>
          </button>
        </div>
      </div>

      <div class="px-6 py-6">
        <div v-if="pending" class="text-gray-500">Загрузка...</div>
        <div
          v-else-if="error"
          class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ error }}
        </div>
        <div v-else-if="!game" class="text-gray-500">Игра не найдена.</div>
        <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="space-y-4">
            <div>
              <div class="text-sm text-gray-500">Название</div>
              <div class="text-base text-gray-900 font-medium">{{ game.title }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Дата прохождения</div>
              <div class="text-gray-900 m-0"><UiDateDisplay :date="game.completionDate" /></div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Время в игре (часы)</div>
              <div class="text-base text-gray-900">{{ game.playTimeHours ?? '—' }}</div>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <div class="text-sm text-gray-500">Оценка</div>
              <div class="text-base text-gray-900">{{ game.rating ?? '—' }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500">Комментарий</div>
              <div class="text-base text-gray-900 whitespace-pre-line">
                {{ game.comment || '—' }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <div class="tracking-wide">Создано</div>
                <div class="text-gray-900 m-0"><UiDateDisplay :date="game.createdAt" /></div>
              </div>
              <div>
                <div class="tracking-wide">Обновлено</div>
                <div class="text-gray-900 m-0"><UiDateDisplay :date="game.updatedAt" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const config = useRuntimeConfig()
const deleting = ref(false)
const error = ref('')

const { data, pending, refresh } = await useAsyncData('game-show', async () => {
  error.value = ''
  try {
    const res = await $fetch(`${config.public.apiBase}/games/${route.params.id}`)
    return res as any
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Не удалось загрузить игру'
    return null
  }
})

const game = computed(() => data.value)

const onDelete = async () => {
  if (!game.value) return
  if (!confirm('Удалить эту игру? Это действие нельзя отменить.')) return
  deleting.value = true
  try {
    await $fetch(`${config.public.apiBase}/games/${route.params.id}`, { method: 'DELETE' })
    router.push('/')
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Не удалось удалить игру'
  } finally {
    deleting.value = false
  }
}
</script>
