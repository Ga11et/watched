<template>
  <div class="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
    <main class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl items-center justify-center">
      <section
        role="alert"
        class="w-full rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm"
      >
        <p class="mb-2 text-xs uppercase tracking-[0.18em] text-gray-500">
          Ошибка {{ statusCode }}
        </p>
        <h1 class="mb-3 text-2xl font-bold text-gray-900">{{ title }}</h1>
        <p class="text-sm text-gray-600">{{ description }}</p>
        <button
          type="button"
          :disabled="pending"
          class="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          @click="retry"
        >
          {{ pending ? 'Повторяем...' : 'Попробовать снова' }}
        </button>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

interface ErrorDetails {
  title?: string
  description?: string
}

const props = defineProps<{ error: NuxtError<ErrorDetails | undefined> }>()
const router = useRouter()
// После неудачной начальной навигации текущий маршрут не совпадает с запрошенным адресом.
const requestUrl = useRequestURL()
const pending = ref(false)

const statusCode = computed(() => props.error.statusCode ?? 500)
const title = computed(() => props.error.data?.title ?? 'Что-то пошло не так')
const description = computed(
  () => props.error.data?.description ?? 'Не удалось открыть страницу. Попробуйте ещё раз.',
)

// Принудительный переход на тот же адрес заново запускает middleware и проверку сессии;
// при успехе Nuxt сам снимает ошибку, при неудаче показывает новую на этой же странице.
const retry = async () => {
  pending.value = true

  try {
    const target = router.resolve(requestUrl.pathname + requestUrl.search + requestUrl.hash)

    await router.replace({ path: target.path, query: target.query, hash: target.hash, force: true })
  } catch {
    // Ошибка повторной проверки уже показана Nuxt на этой странице.
  } finally {
    pending.value = false
  }
}
</script>
