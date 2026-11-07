<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Сериалы', to: '/series' },
        { label: seriesTitle || 'Загрузка...', to: `/series/${route.params.id}` },
        { label: 'Редактирование' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать сериал</h1>
          <p class="mt-1 text-sm text-gray-500">Измените данные сериала</p>
        </div>
        <NuxtLink
          :to="`/series/${route.params.id}`"
          class="text-sm text-indigo-600 hover:text-indigo-800"
          >Назад к деталям</NuxtLink
        >
      </div>

      <EntitiesSeriesFormsEdit
        :series-id="String(route.params.id)"
        @title-loaded="seriesTitle = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const seriesTitle = ref('')
</script>
