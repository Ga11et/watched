<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Справочник: книги', to: '/books' },
        { label: 'Справочник: авторы', to: '/books/authors' },
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
        <EntitiesAuthorsOutputsDetails v-else :author="author" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Author } from '~/types/api'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const error = ref('')
const deleting = ref(false)

const { data: author, pending } = await useAsyncData(`author-${route.params.id}`, async () => {
  return await _fetch<Author>(`${config.public.apiBase}/authors/${route.params.id}`)
})

const onDelete = async () => {
  if (!author.value) return
  if (!confirm('Удалить этого автора? Это действие нельзя отменить.')) return
  deleting.value = true
  try {
    await _fetch(`${config.public.apiBase}/authors/${route.params.id}`, { method: 'DELETE' })
    router.push('/books/authors')
  } catch (e: any) {
    error.value = e?.data?.message || 'Не удалось удалить автора'
  } finally {
    deleting.value = false
  }
}
</script>
