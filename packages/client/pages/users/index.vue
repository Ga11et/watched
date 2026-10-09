<script setup lang="ts">
interface User {
  id: string
  username: string | null
  email: string | null
  name: string
  role: 'ADMIN' | 'USER' | 'GUEST'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const { request } = useApiRequest()

const {
  data: users,
  pending,
  error,
} = await useAsyncData<User[]>('users-list', () => {
  return request<User[]>(`/users`)
})

const formatDate = (value: string): string => {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <LayoutBreadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Пользователи' }]" />

    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900">Пользователи</h2>
      <span class="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600">
        Всего: {{ users?.length ?? 0 }}
      </span>
    </div>

    <div
      v-if="error"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div v-else-if="pending" class="py-12 text-center text-gray-500">Загрузка пользователей...</div>

    <div v-else-if="!users?.length" class="py-12 text-center text-gray-500">
      Пользователей пока нет
    </div>

    <TransitionGroup
      v-else
      name="cards-list"
      tag="div"
      class="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
    >
      <article
        v-for="user in users"
        :key="user.id"
        class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              <NuxtLink :to="`/users/${user.username || user.id}`" class="hover:text-indigo-700">
                {{ user.name }}
              </NuxtLink>
            </h3>
            <p class="text-sm text-gray-500">@{{ user.username || 'no-username' }}</p>
          </div>
          <span
            class="rounded-full px-2.5 py-1 text-xs font-semibold"
            :class="
              user.role === 'ADMIN'
                ? 'bg-purple-100 text-purple-700'
                : user.role === 'GUEST'
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-indigo-100 text-indigo-700'
            "
          >
            {{ user.role }}
          </span>
        </div>

        <dl class="space-y-2 text-sm">
          <div class="flex justify-between gap-2">
            <dt class="text-gray-500">Email</dt>
            <dd class="truncate text-right text-gray-800">{{ user.email || '—' }}</dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-gray-500">Статус</dt>
            <dd :class="user.isActive ? 'text-emerald-600' : 'text-rose-600'">
              {{ user.isActive ? 'Активен' : 'Неактивен' }}
            </dd>
          </div>
          <div class="flex justify-between gap-2">
            <dt class="text-gray-500">Создан</dt>
            <dd class="text-gray-800">{{ formatDate(user.createdAt) }}</dd>
          </div>
        </dl>
      </article>
    </TransitionGroup>
  </div>
</template>
