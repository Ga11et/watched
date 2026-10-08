<template>
  <div class="flex gap-6">
    <div class="flex-shrink-0">
      <div v-if="director.photo" class="w-32 h-40 rounded-lg overflow-hidden">
        <img
          :src="`${config.public.apiBase}${director.photo}`"
          :alt="director.fullName"
          class="w-full h-full object-cover"
        />
      </div>
      <div v-else class="w-32 h-40 rounded-lg bg-gray-100 flex items-center justify-center">
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
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    </div>

    <div class="flex-1">
      <CommonOutputsConfigurableFields :config="outputLayout">
        <template #fullName>
          <div>
            <div class="text-sm text-gray-500">ФИО</div>
            <div class="text-xl font-medium text-gray-900">{{ director.fullName }}</div>
          </div>
        </template>

        <template #comment>
          <div>
            <div class="text-sm text-gray-500">Комментарий</div>
            <div class="text-base text-gray-900 whitespace-pre-line">
              {{ director.comment || '—' }}
            </div>
          </div>
        </template>

        <template #createdAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Создано</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="director.createdAt" /></div>
          </div>
        </template>

        <template #updatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Обновлено</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="director.updatedAt" /></div>
          </div>
        </template>
      </CommonOutputsConfigurableFields>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Director } from '~/types/api'

defineProps<{ director: Director }>()
const config = useRuntimeConfig()

const outputLayout = [
  { columns: 1, fields: [{ id: 'fullName' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
  { columns: 2, fields: [{ id: 'createdAt' }, { id: 'updatedAt' }] },
]
</script>
