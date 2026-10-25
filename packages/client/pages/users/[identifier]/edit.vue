<script setup lang="ts">
const route = useRoute()
const identifier = String(route.params.identifier)
const userName = ref('')
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Пользователи', to: '/users' },
        {
          label: userName || 'Профиль пользователя',
          to: `/users/${encodeURIComponent(identifier)}`,
        },
        { label: 'Редактирование' },
      ]"
    />

    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl font-semibold text-gray-900 md:text-2xl">Редактирование профиля</h1>
        <p class="mt-1 text-sm text-gray-500">Измените имя, логин и email.</p>
      </div>

      <EntitiesUserFormsEdit :key="identifier" :identifier @name-loaded="userName = $event" />
    </div>
  </div>
</template>
