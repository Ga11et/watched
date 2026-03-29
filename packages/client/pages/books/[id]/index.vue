<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Книги', to: '/books' },
        { label: book?.title || 'Загрузка...' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">
            {{ book?.title || 'Книга' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500" v-if="book">Детали книги</p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/books/${route.params.id}/edit`"
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
        <div v-else-if="!book" class="text-gray-500">Книга не найдена.</div>
        <EntitiesBooksOutputsDetails v-else :book="book" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Book } from '~/types/api'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const error = ref('')
const deleting = ref(false)

const { data: book, pending } = await useAsyncData(`book-${route.params.id}`, async () => {
  return await _fetch<Book>(`${config.public.apiBase}/books/${route.params.id}`)
})

const onDelete = async () => {
  if (!book.value) return
  if (!confirm('Удалить эту книгу? Это действие нельзя отменить.')) return
  deleting.value = true
  try {
    await _fetch(`${config.public.apiBase}/books/${route.params.id}`, { method: 'DELETE' })
    router.push('/books')
  } catch (e: any) {
    error.value = e?.data?.message || 'Не удалось удалить книгу'
  } finally {
    deleting.value = false
  }
}
</script>
