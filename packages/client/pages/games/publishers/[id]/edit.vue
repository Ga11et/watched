<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Игры', to: '/games' },
        { label: 'Издатели', to: '/games/publishers' },
        { label: publisherName || 'Загрузка...', to: `/games/publishers/${route.params.id}` },
        { label: 'Редактирование' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать издателя</h1>
        <p class="mt-1 text-sm text-gray-500">Измените данные издателя</p>
      </div>

      <EntitiesPublishersFormsEdit
        :publisher-id="String(route.params.id)"
        @title-loaded="publisherName = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const publisherName = ref('')
</script>
