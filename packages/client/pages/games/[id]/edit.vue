<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Игры', to: '/games' },
        { label: gameTitle || 'Загрузка...', to: `/games/${route.params.id}` },
        { label: 'Редактирование' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать игру</h1>
          <p class="mt-1 text-sm text-gray-500">Обновите поля ниже и сохраните изменения.</p>
        </div>
        <NuxtLink
          :to="`/games/${route.params.id}`"
          class="text-sm text-indigo-600 hover:text-indigo-800"
          >Назад к деталям</NuxtLink
        >
      </div>

      <EntitiesGamesFormsEdit
        :game-id="String(route.params.id)"
        @title-loaded="gameTitle = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const gameTitle = ref('')
</script>
