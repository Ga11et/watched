<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Справочник: книги', to: '/books' },
        { label: 'Справочник: авторы', to: '/books/authors' },
        { label: authorName || 'Загрузка...', to: `/books/authors/${route.params.id}` },
        { label: 'Редактирование' },
      ]"
    />

    <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-gray-100 px-6 py-5">
        <h1 class="text-xl md:text-2xl font-semibold text-gray-900">Редактировать автора</h1>
        <p class="mt-1 text-sm text-gray-500">Измените данные автора и сохраните изменения.</p>
      </div>

      <EntitiesAuthorsFormsEdit
        :author-id="String(route.params.id)"
        @name-loaded="authorName = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const authorName = ref('')
</script>
