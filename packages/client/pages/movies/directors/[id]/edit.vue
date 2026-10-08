<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Фильмы', to: '/movies' },
        { label: 'Режиссёры', to: '/movies/directors' },
        { label: directorName || 'Загрузка...', to: `/movies/directors/${route.params.id}` },
        { label: 'Редактирование' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать режиссёра</h1>
        <p class="mt-1 text-sm text-gray-500">Измените данные режиссёра</p>
      </div>

      <EntitiesDirectorsFormsEdit
        :director-id="String(route.params.id)"
        @title-loaded="directorName = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const directorName = ref('')
</script>
