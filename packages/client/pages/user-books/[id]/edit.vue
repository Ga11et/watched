<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Книги', to: '/user-books' },
        { label: bookTitle || 'Загрузка...', to: `/user-books/${route.params.id}` },
        { label: 'Редактирование' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать книгу</h1>
        <p class="mt-1 text-sm text-gray-500">Измените поля списка и сохраните изменения.</p>
      </div>

      <EntitiesUserBooksFormsEdit
        :user-book-id="String(route.params.id)"
        @title-loaded="bookTitle = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const bookTitle = ref('')
</script>
