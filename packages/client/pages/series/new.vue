<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Сериалы', to: '/series' },
        { label: 'Добавление' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить сериал</h1>
          <p class="mt-1 text-sm text-gray-500">Заполните поля ниже, чтобы добавить новый сериал</p>
        </div>
      </div>

      <EntitiesSeriesFormsNew />
    </div>
  </div>
</template>
