<template>
  <div class="mx-auto max-w-7xl">
    <Breadcrumbs :items="[{ label: 'Home', to: '/' }, { label: 'New' }]" />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Add New Game</h1>
          <p class="mt-1 text-sm text-gray-500">Provide details below to create a new game entry.</p>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="px-6 py-6">
        <div class="grid grid-cols-1 gap-6">
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700">Title<span class="text-red-500">*</span></label>
            <input
              id="title"
              v-model.trim="form.title"
              type="text"
              :class="[
                'mt-1 block w-full rounded-lg border px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition',
                titleError ? 'border-red-300 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200 focus:border-indigo-500'
              ]"
              placeholder="e.g. Baldur\'s Gate 3"
            />
            <p v-if="titleError" class="mt-1 text-sm text-red-600">{{ titleError }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="completionDate" class="block text-sm font-medium text-gray-700">Completion Date</label>
              <input
                id="completionDate"
                v-model="form.completionDate"
                type="date"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
              <p class="mt-1 text-xs text-gray-500">When did you finish this game?</p>
            </div>
            <div>
              <label for="playTimeHours" class="block text-sm font-medium text-gray-700">Play Time (hours)</label>
              <div class="mt-1 relative">
                <input
                  id="playTimeHours"
                  v-model.number="form.playTimeHours"
                  type="number"
                  min="0"
                  step="0.5"
                  class="block w-full rounded-lg border border-gray-300 pl-3 pr-12 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g. 12.5"
                />
                <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">hrs</span>
              </div>
              <p class="mt-1 text-xs text-gray-500">Approximate total hours played.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="rating" class="block text-sm font-medium text-gray-700">Rating (1-100)</label>
              <input
                id="rating"
                v-model.number="form.rating"
                type="number"
                min="1"
                max="100"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="e.g. 85"
              />
              <p class="mt-1 text-xs text-gray-500">Your personal score for the game.</p>
            </div>
            <div>
              <label for="comment" class="block text-sm font-medium text-gray-700">Comment</label>
              <textarea
                id="comment"
                v-model="form.comment"
                rows="4"
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Your thoughts about the game"
              />
              <p class="mt-1 text-xs text-gray-500">Optional. Share highlights, pros/cons, or memorable moments.</p>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              :disabled="submitting"
              class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg v-if="submitting" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <span>{{ submitting ? 'Saving...' : 'Create' }}</span>
            </button>
            <NuxtLink to="/" class="text-gray-600 hover:text-gray-800">Cancel</NuxtLink>
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
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const submitting = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  completionDate: '',
  playTimeHours: undefined as number | undefined,
  comment: '',
  rating: undefined as number | undefined,
})

const onSubmit = async () => {
  error.value = ''
  if (titleError.value) return
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

    await $fetch(`${config.public.apiBase}/games`, {
      method: 'POST',
      body: payload,
    })

    router.push('/')
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Failed to create game'
  } finally {
    submitting.value = false
  }
}

const titleError = computed(() => {
  if (!form.title.trim()) return 'Title is required'
  if (form.title.length > 200) return 'Title is too long'
  return ''
})
</script>
