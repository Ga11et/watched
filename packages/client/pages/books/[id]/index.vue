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
        <div v-else class="flex gap-6">
          <div class="flex-shrink-0">
            <div v-if="book.cover" class="w-40 h-56 rounded-lg overflow-hidden">
              <img :src="coverUrl" :alt="book.title" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-40 h-56 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <!-- Название книги во всю ширину -->
            <div class="mb-6">
              <div class="text-sm text-gray-500">Название</div>
              <div class="text-xl text-gray-900 font-medium">{{ book.title }}</div>
            </div>

            <!-- Остальная информация в 2 колонки -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div class="space-y-4">
                <div>
                  <div class="text-sm text-gray-500">Автор</div>
                  <div class="text-base text-gray-900">
                    <NuxtLink
                      v-if="book.author"
                      :to="`/books/authors/${book.author.id}`"
                      class="text-indigo-600 hover:text-indigo-900"
                    >
                      {{ book.author.fullName }}
                    </NuxtLink>
                    <span v-else>—</span>
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Жанр</div>
                  <div class="text-base text-gray-900">{{ book.genre || '—' }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Год издания</div>
                  <div class="text-base text-gray-900">{{ book.publishYear || '—' }}</div>
                </div>
              </div>
              <div class="space-y-4">
                <div>
                  <div class="text-sm text-gray-500">Рейтинг</div>
                  <div class="text-base text-gray-900">
                    {{ book.rating != null ? `${book.rating}/100` : '—' }}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Количество страниц</div>
                  <div class="text-base text-gray-900">{{ book.pageCount || '—' }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">Дата прочтения</div>
                  <div class="text-gray-900 m-0">
                    <UiDateDisplay v-if="book.readAt" :date="book.readAt" />
                    <span v-else>—</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="book.comment" class="mt-6">
              <div class="text-sm font-medium text-gray-700 mb-2">Комментарий</div>
              <div class="text-base text-gray-900 whitespace-pre-line">
                {{ book.comment }}
              </div>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <div class="tracking-wide">Создано</div>
                <div class="text-gray-900 m-0"><UiDateDisplay :date="book.createdAt" /></div>
              </div>
              <div>
                <div class="tracking-wide">Обновлено</div>
                <div class="text-gray-900 m-0"><UiDateDisplay :date="book.updatedAt" /></div>
              </div>
            </div>
          </div>
        </div>
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
  return await $fetch<Book>(`${config.public.apiBase}/books/${route.params.id}`)
})

const coverUrl = computed(() => {
  if (!book.value?.cover) return ''
  return book.value.cover.startsWith('http')
    ? book.value.cover
    : `${config.public.apiBase}${book.value.cover}`
})

const onDelete = async () => {
  if (!book.value) return
  if (!confirm('Удалить эту книгу? Это действие нельзя отменить.')) return
  deleting.value = true
  try {
    await $fetch(`${config.public.apiBase}/books/${route.params.id}`, { method: 'DELETE' })
    router.push('/books')
  } catch (e: any) {
    error.value = e?.data?.message || 'Не удалось удалить книгу'
  } finally {
    deleting.value = false
  }
}
</script>
