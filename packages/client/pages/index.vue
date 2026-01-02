<script setup>
const viewMode = useCookie('watched_view_mode', {
  default: () => 'cards',
  sameSite: 'lax',
})

const error = ref('')

watchEffect(() => {
  if (viewMode.value !== 'cards' && viewMode.value !== 'table') {
    viewMode.value = 'cards'
  }
})
</script>

<template>
  <div>
    <div
      v-if="error"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Games Section -->
      <div class="module-section">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Игры</h2>
          <NuxtLink
            to="/games"
            class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
          >
            Перейти к играм
          </NuxtLink>
        </div>
        <p class="text-gray-600 mb-4">
          Отслеживайте пройденные игры, оценивайте их и делитесь впечатлениями
        </p>
      </div>

      <!-- Movies Section -->
      <div class="module-section">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">Фильмы</h2>
          <NuxtLink
            to="/movies"
            class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
          >
            Перейти к фильмам
          </NuxtLink>
        </div>
        <p class="text-gray-600 mb-4">
          Ведите учет просмотренных фильмов и оценивайте работы любимых режиссёров
        </p>
      </div>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
