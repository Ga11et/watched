<template>
  <div class="flex flex-col gap-6 sm:flex-row">
    <div
      class="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gray-100"
      aria-hidden="true"
    >
      <svg class="h-12 w-12 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clip-rule="evenodd"
        />
      </svg>
    </div>

    <div class="min-w-0 flex-1">
      <CommonOutputsConfigurableFields :config="outputLayout">
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

        <template v-if="user.email !== undefined" #email>
          <div>
            <div class="text-sm text-gray-500">Email</div>
            <div class="break-all text-base text-gray-900">{{ user.email ?? '—' }}</div>
          </div>
        </template>

        <template #createdAt>
          <div>
            <div class="text-sm text-gray-500">Дата регистрации</div>
            <div class="text-base text-gray-900"><UiDateDisplay :date="user.createdAt" /></div>
          </div>
        </template>

        <template #updatedAt>
          <div>
            <div class="text-sm text-gray-500">Обновлено</div>
            <div class="text-base text-gray-900"><UiDateDisplay :date="user.updatedAt" /></div>
          </div>
        </template>
      </CommonOutputsConfigurableFields>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '~/types/api'

defineProps<{ user: User }>()

const outputLayout = [
  { columns: 2, fields: [{ id: 'role' }, { id: 'email' }] },
  { columns: 2, fields: [{ id: 'createdAt' }, { id: 'updatedAt' }] },
]
</script>
