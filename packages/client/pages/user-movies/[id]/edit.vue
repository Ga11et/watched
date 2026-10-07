<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Ваши фильмы', to: '/user-movies' },
        { label: movieTitle || 'Запись фильма', to: `/user-movies/${route.params.id}` },
        { label: 'Редактирование' },
      ]"
    />

    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl font-semibold text-gray-900 md:text-2xl">Редактировать запись фильма</h1>
        <p class="mt-1 text-sm text-gray-500">
          Измените персональные поля. Данные фильма в каталоге доступны только для чтения.
        </p>
      </div>

      <EntitiesUserMoviesFormsEdit
        :key="String(route.params.id)"
        :user-movie-id="String(route.params.id)"
        @title-loaded="movieTitle = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const movieTitle = ref('')
</script>
