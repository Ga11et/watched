<template>
  <div class="flex gap-6">
    <div class="flex-shrink-0">
      <div v-if="user.cover" class="h-56 w-40 overflow-hidden rounded-lg">
        <img :src="coverUrl" :alt="user.name" class="h-full w-full object-cover" />
      </div>
      <div v-else class="flex h-56 w-40 items-center justify-center rounded-lg bg-gray-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    </div>

    <div class="flex-1">
      <CommonOutputsConfigurableFields :config="userOutputLayout">
        <template #email>
          <div>
            <div class="text-sm text-gray-500">Email</div>
            <div class="text-base text-gray-900">{{ user.email || '—' }}</div>
          </div>
        </template>

        <template #role>
          <div>
            <div class="text-sm text-gray-500">Роль</div>
            <div
              class="inline-flex rounded-full bg-indigo-100 px-4 py-1 text-xs font-medium text-indigo-700"
            >
              {{ user.role }}
            </div>
          </div>
        </template>

        <template #status>
          <div>
            <div class="text-sm text-gray-500">Статус</div>
            <div class="text-base" :class="user.isActive ? 'text-emerald-600' : 'text-rose-600'">
              {{ user.isActive ? 'Активен' : 'Неактивен' }}
            </div>
          </div>
        </template>

        <template #createdAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Создано</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="user.createdAt" /></div>
          </div>
        </template>

        <template #updatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Обновлено</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="user.updatedAt" /></div>
          </div>
        </template>
      </CommonOutputsConfigurableFields>
    </div>
  </div>
</template>

<script setup lang="ts">
interface UserDetailsModel {
  id: string
  name: string
  username?: string | null
  email?: string | null
  role: 'ADMIN' | 'USER' | 'GUEST'
  isActive: boolean
  cover?: string | null
  createdAt: string
  updatedAt: string
}

interface OutputFieldConfig {
  id: string
}

interface OutputRowConfig {
  columns?: number
  fields: OutputFieldConfig[]
}

interface Props {
  user: UserDetailsModel
}

const props = defineProps<Props>()

const config = useRuntimeConfig()

const userOutputLayout: OutputRowConfig[] = [
  {
    columns: 2,
    fields: [{ id: 'email' }, { id: 'role' }],
  },
  {
    columns: 1,
    fields: [{ id: 'status' }],
  },
  {
    columns: 2,
    fields: [{ id: 'createdAt' }, { id: 'updatedAt' }],
  },
]

const coverUrl = computed(() => {
  if (!props.user.cover) return ''
  return `${config.public.apiBase}${props.user.cover}`
})
</script>
