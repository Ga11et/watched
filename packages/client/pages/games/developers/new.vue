<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs :items="breadcrumbItems" />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить разработчика</h1>
          <p class="mt-1 text-sm text-gray-500">
            Заполните поля ниже, чтобы добавить нового разработчика
          </p>
        </div>
      </div>

      <EntitiesGamesFormsDevelopersNew />
    </div>
  </div>
</template>

<script setup lang="ts">
const breadcrumbItems = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Игры', to: '/games' },
  { label: 'Разработчики', to: '/games/developers' },
  { label: 'Новый разработчик' },
])
</script>
