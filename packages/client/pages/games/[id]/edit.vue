<template>
  <div class="mx-auto max-w-7xl">
    <Breadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Редактировать' }]" />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать игру</h1>
          <p class="mt-1 text-sm text-gray-500">Обновите поля ниже и сохраните изменения.</p>
        </div>
        <NuxtLink :to="`/games/${route.params.id}`" class="text-sm text-indigo-600 hover:text-indigo-800">Назад к деталям</NuxtLink>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="grid grid-cols-1 gap-6">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700">Название<span class="text-red-500">*</span></label>
            <input
              id="title"
              v-model.trim="form.title"
              type="text"
              :disabled="!hydrated"
              :class="[
                'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                errors.title ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500',
                !hydrated ? 'disabled:cursor-not-allowed disabled:opacity-60' : ''
              ]"
              placeholder="например, Baldur's Gate 3"
            />
            <p v-if="errors.title" class="mt-1 text-sm text-red-600">{{ errors.title }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="completionDate" class="block text-sm font-medium text-gray-700">Дата прохождения</label>
              <input
                id="completionDate"
                v-model="form.completionDate"
                type="date"
                :disabled="!hydrated"
                :class="[
                  'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
                  !hydrated ? 'disabled:cursor-not-allowed disabled:opacity-60' : ''
                ]"
              />
              <p class="mt-1 text-xs text-gray-500">Когда вы прошли эту игру?</p>
            </div>
            <div>
              <label for="playTimeHours" class="block text-sm font-medium text-gray-700">Время в игре (часы)</label>
              <div class="mt-1 relative">
                <input
                  id="playTimeHours"
                  v-model.number="form.playTimeHours"
                  type="number"
                  min="0"
                  step="0.5"
                  :disabled="!hydrated"
                  :class="[
                    'block w-full rounded-lg border border-gray-300 pl-3 pr-12 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
                    !hydrated ? 'disabled:cursor-not-allowed disabled:opacity-60' : ''
                  ]"
                  placeholder="например, 12.5"
                />
                <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">ч</span>
              </div>
              <p class="mt-1 text-xs text-gray-500">Примерное общее время в игре.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="rating" class="block text-sm font-medium text-gray-700">Оценка (1-100)</label>
              <input
                id="rating"
                v-model.number="form.rating"
                type="number"
                min="1"
                max="100"
                :disabled="!hydrated"
                :class="[
                  'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
                  !hydrated ? 'disabled:cursor-not-allowed disabled:opacity-60' : ''
                ]"
                placeholder="например, 85"
              />
              <p class="mt-1 text-xs text-gray-500">Ваша личная оценка игры.</p>
            </div>
            <div>
              <label for="comment" class="block text-sm font-medium text-gray-700">Комментарий</label>
              <textarea
                id="comment"
                v-model="form.comment"
                rows="4"
                :disabled="!hydrated"
                :class="[
                  'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200',
                  !hydrated ? 'disabled:cursor-not-allowed disabled:opacity-60' : ''
                ]"
                placeholder="Ваши мысли об игре"
              />
              <p class="mt-1 text-xs text-gray-500">Необязательно. Поделитесь яркими моментами, плюсами/минусами или впечатлениями.</p>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              :disabled="submitting || !hydrated"
              class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg v-if="submitting" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>{{ submitting ? 'Сохранение...' : 'Сохранить изменения' }}</span>
            </button>
            <NuxtLink :to="`/games/${route.params.id}`" class="text-gray-600 hover:text-gray-800">Отмена</NuxtLink>
          </div>

          <div v-if="error" class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ error }}
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const submitting = ref(false)
const error = ref('')
const errors = ref<Record<string, string>>({})
const hydrated = ref(false)

onMounted(() => {
  hydrated.value = true
})

const form = reactive({
  title: '',
  completionDate: '',
  playTimeHours: undefined as number | undefined,
  comment: '',
  rating: undefined as number | undefined,
})

onMounted(async () => {
  hydrated.value = true
  try {
    const config = useRuntimeConfig()
    const data = await $fetch(`${config.public.apiBase}/games/${route.params.id}`)
    form.title = data.title || ''
    form.completionDate = data.completionDate ? String(data.completionDate).slice(0, 10) : ''
    form.playTimeHours = typeof data.playTimeHours === 'number' ? data.playTimeHours : undefined
    form.comment = data.comment || ''
    form.rating = typeof data.rating === 'number' ? data.rating : undefined
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Не удалось загрузить игру'
  }
})

const onSubmit = async () => {
  error.value = ''
  errors.value = {}
  // Local validation
  // if (!form.title.trim()) {
  //   errors.value.title = 'Название обязательно'
  //   return
  // }
  // if (form.title.length > 200) {
  //   errors.value.title = 'Название слишком длинное'
  //   return
  // }
  submitting.value = true
  try {
    const config = useRuntimeConfig()
    const payload: Record<string, any> = {
      title: form.title,
      comment: form.comment || null,
    }
    if (form.completionDate) payload.completionDate = form.completionDate
    if (typeof form.playTimeHours === 'number') payload.playTimeHours = form.playTimeHours
    if (typeof form.rating === 'number') payload.rating = form.rating

    await $fetch(`${config.public.apiBase}/games/${route.params.id}`, {
      method: 'PUT',
      body: payload,
    })

    router.push(`/games/${route.params.id}`)
  } catch (e: any) {
    const base = e?.data?.message || e?.message || 'Не удалось сохранить изменения'
    const violations = e?.data?.violations
    if (Array.isArray(violations) && violations.length) {
      // Map violations into errors object for inline display
      violations.forEach(v => {
        errors.value[v.field] = v.message
      })
    }
    error.value = base
  } finally {
    submitting.value = false
  }
}

</script>
