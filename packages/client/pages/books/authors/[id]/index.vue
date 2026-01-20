<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Книги', to: '/books' },
        { label: 'Авторы', to: '/books/authors' },
        { label: author?.fullName || 'Загрузка...' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-200 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">
            {{ author?.fullName || 'Автор' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500" v-if="author">Детали автора</p>
        </div>
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/books/authors/${route.params.id}/edit`"
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
        <div v-else-if="!author" class="text-gray-500">Автор не найден.</div>
        <div v-else class="flex gap-6">
          <div class="flex-shrink-0">
            <div v-if="author.photo" class="w-40 h-56 rounded-lg overflow-hidden">
              <img
                :src="`${config.public.apiBase}${author.photo}`"
                :alt="author.fullName"
                class="w-full h-full object-cover"
              />
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
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>
            </div>
          </div>
          <div class="flex-1 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="space-y-4">
              <div>
                <div class="text-sm text-gray-500">Имя</div>
                <div class="text-base text-gray-900 font-medium">{{ author.fullName }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-500">Комментарий</div>
                <div class="text-base text-gray-900 whitespace-pre-line">
                  {{ author.comment || '—' }}
                </div>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <div class="text-sm text-gray-500">Фотография</div>
                <div class="text-base text-gray-900">
                  {{ author.photo ? 'Есть' : 'Нет' }}
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <div class="tracking-wide">Создано</div>
                  <div class="text-gray-900 m-0"><UiDateDisplay :date="author.createdAt" /></div>
                </div>
                <div>
                  <div class="tracking-wide">Обновлено</div>
                  <div class="text-gray-900 m-0"><UiDateDisplay :date="author.updatedAt" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const error = ref('')
const deleting = ref(false)

interface Author {
  id: string
  fullName: string
  comment?: string | null
  photo?: string | null
  createdAt: string
  updatedAt: string
}

const { data: author, pending } = await useAsyncData(`author-${route.params.id}`, async () => {
  return await $fetch<Author>(`${config.public.apiBase}/authors/${route.params.id}`)
})

const onDelete = async () => {
  if (!author.value) return
  if (!confirm('Удалить этого автора? Это действие нельзя отменить.')) return
  deleting.value = true
  try {
    await $fetch(`${config.public.apiBase}/authors/${route.params.id}`, { method: 'DELETE' })
    router.push('/books/authors')
  } catch (e: any) {
    error.value = e?.data?.message || 'Не удалось удалить автора'
  } finally {
    deleting.value = false
  }
}
</script>
