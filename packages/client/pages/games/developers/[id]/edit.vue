<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Игры', to: '/games' },
        { label: 'Разработчики', to: '/games/developers' },
        { label: developerName || 'Загрузка...', to: `/games/developers/${route.params.id}` },
        { label: 'Редактирование' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать разработчика</h1>
        <p class="mt-1 text-sm text-gray-500">Измените данные разработчика</p>
      </div>

      <EntitiesDevelopersFormsEdit
        :developer-id="String(route.params.id)"
        @title-loaded="developerName = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const developerName = ref('')
</script>
