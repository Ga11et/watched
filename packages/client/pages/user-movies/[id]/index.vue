<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Ваши фильмы', to: '/user-movies' },
        { label: userMovie?.movie.title || 'Запись фильма' },
      ]"
    />

    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-5"
      >
        <div>
          <h1 class="text-xl font-semibold text-gray-900 md:text-2xl">
            {{ userMovie?.movie.title || 'Запись фильма' }}
          </h1>
          <p v-if="userMovie" class="mt-1 text-sm text-gray-500">Детали вашей записи</p>
        </div>
        <NuxtLink
          v-if="userMovie && !pending && !error"
          :to="`/movies/${userMovie.movie.id}`"
          class="rounded-lg bg-emerald-600 px-3 py-2 text-white shadow-sm transition hover:bg-emerald-700"
        >
          Фильм в каталоге
        </NuxtLink>
      </div>

      <div class="px-6 py-6">
        <div v-if="pending" role="status" class="text-gray-500">Загрузка...</div>
        <div
          v-else-if="error"
          role="alert"
          class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          Не удалось загрузить запись фильма.
          <button type="button" class="underline" @click="refresh()">Попробовать снова</button>
        </div>
        <div v-else-if="!userMovie" class="text-gray-500">Запись фильма не найдена.</div>
        <EntitiesUserMoviesOutputsDetails v-else :user-movie="userMovie" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { get } = useUserMovies()
const id = computed(() => String(route.params.id))
const {
  data: userMovie,
  pending,
  error,
  refresh,
} = useLazyAsyncData(
  computed(() => `user-movie-${id.value}`),
  () => get(id.value),
  { server: false },
)
</script>
