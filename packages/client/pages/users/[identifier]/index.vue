<script setup lang="ts">
const route = useRoute()
const { get } = useUsers()

const identifier = String(route.params.identifier)

const {
  data: user,
  pending,
  error,
} = useLazyAsyncData(`user-profile-${identifier}`, () => get(identifier))

const errorStatus = computed(() => parseRequestError(error.value).statusCode)
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs
      :items="[
        { label: 'Главная', to: '/' },
        { label: 'Пользователи', to: '/users' },
        { label: user?.name || 'Профиль пользователя' },
      ]"
    />

    <div v-if="pending" role="status" class="py-12 text-center text-gray-500">
      Загрузка профиля...
    </div>

    <div v-else-if="errorStatus === 404" class="py-12 text-center text-gray-500">
      Пользователь не найден
    </div>

    <div
      v-else-if="error"
      role="alert"
      class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{
        errorStatus === 403
          ? 'Нет доступа к профилю пользователя.'
          : 'Не удалось загрузить профиль пользователя. Попробуйте позже.'
      }}
    </div>

    <div
      v-else-if="user"
      class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-5"
      >
        <div class="min-w-0">
          <h1 class="break-words text-xl font-semibold text-gray-900 md:text-2xl">
            {{ user.name }}
          </h1>
          <p class="mt-1 break-all text-sm text-gray-500">
            {{ user.username ? `@${user.username}` : 'Логин не указан' }}
          </p>
        </div>
        <span
          v-if="!user.isActive"
          class="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
        >
          Неактивен
        </span>
      </div>

      <div class="px-6 py-6">
        <EntitiesUserOutputsDetails :user />
      </div>
    </div>
  </div>
</template>
