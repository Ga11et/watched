<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Ваши книги', to: '/user-books' },
        { label: 'Добавление' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white">
      <div class="border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Добавить книгу</h1>
          <p class="mt-1 text-sm text-gray-500">
            Заполните поля ниже, чтобы создать новую запись о книге.
          </p>
        </div>
      </div>

      <EntitiesUserBooksFormsNew />
    </div>
  </div>
</template>
