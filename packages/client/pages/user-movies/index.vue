<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Ваши фильмы' }]" />

    <h1 class="mb-6 text-2xl font-bold">Ваши фильмы</h1>

    <div v-if="pending" role="status" class="py-8 text-center text-gray-500">Загрузка...</div>
    <div
      v-else-if="error"
      role="alert"
      class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      Не удалось загрузить фильмы.
      <button type="button" class="underline" @click="refresh()">Попробовать снова</button>
    </div>
    <UiEmpty v-else-if="!movies?.length" message="Фильмов в вашем списке пока нет." />
    <EntitiesUserMoviesCardsView v-else :movies="movies" />
  </div>
</template>

<script setup lang="ts">
const { list } = useUserMovies()
const {
  data: movies,
  pending,
  error,
  refresh,
} = useLazyAsyncData('user-movies', list, {
  server: false,
})
</script>
