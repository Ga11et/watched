<template>
  <div class="mx-auto max-w-7xl">
    <Breadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Фильмы', to: '/movies' },
        { label: 'Режиссёры', to: '/movies/directors' },
        { label: director?.fullName || 'Загрузка...' },
      ]"
    />

    <div
      v-if="error"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div v-if="pending" class="text-center py-12 text-gray-500">Загрузка...</div>
    <template v-else>
      <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div class="border-b border-gray-100 px-6 py-5">
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">{{ director?.fullName }}</h1>
          <p v-if="director?.comment" class="mt-2 text-gray-600">{{ director.comment }}</p>
        </div>
      </div>

      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold">Фильмы режиссёра</h2>
        <NuxtLink
          to="/movies/new"
          class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Добавить фильм
        </NuxtLink>
      </div>

      <div v-if="!directorMovies?.length" class="text-center py-12 text-gray-500">
        Фильмов этого режиссёра пока нет.
      </div>
      <MoviesTableView v-else :movies="directorMovies" />
    </template>
  </div>
</template>

<script setup>
const route = useRoute()
const error = ref('')
const pending = ref(true)
const director = ref(null)
const directorMovies = ref([])

onMounted(async () => {
  try {
    // TODO: Implement API calls to fetch director and their movies
    pending.value = false
    error.value = ''
  } catch (e) {
    error.value = e.message || 'Произошла ошибка при загрузке данных'
    pending.value = false
  }
})
</script>

<style scoped>
/* Add styles here if needed */
</style>
