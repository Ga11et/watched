<template>
  <div class="flex gap-6">
    <div class="flex-shrink-0">
      <div v-if="developer.photo" class="h-56 w-40 overflow-hidden rounded-lg">
        <img :src="photoUrl" :alt="developer.fullName" class="h-full w-full object-cover" />
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
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
          />
        </svg>
      </div>
    </div>

    <div class="flex-1">
      <CommonOutputsConfigurableFields :config="outputLayout">
        <template #fullName>
          <div>
            <div class="text-sm text-gray-500">Имя</div>
            <div class="text-xl font-medium text-gray-900">{{ developer.fullName }}</div>
          </div>
        </template>

        <template v-if="developer.comment" #comment>
          <EntitiesCommonCommentBlock :comment="developer.comment" />
        </template>

        <template #createdAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Создано</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="developer.createdAt" /></div>
          </div>
        </template>

        <template #updatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Обновлено</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="developer.updatedAt" /></div>
          </div>
        </template>
      </CommonOutputsConfigurableFields>
    </div>
  </div>
</template>

<script setup lang="ts">
interface DeveloperDetailsModel {
  fullName: string
  comment?: string | null
  photo?: string | null
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
  developer: DeveloperDetailsModel
}

const props = defineProps<Props>()
const config = useRuntimeConfig()

const outputLayout: OutputRowConfig[] = [
  {
    columns: 1,
    fields: [{ id: 'fullName' }],
  },
  {
    columns: 1,
    fields: [{ id: 'comment' }],
  },
  {
    columns: 2,
    fields: [{ id: 'createdAt' }, { id: 'updatedAt' }],
  },
]

const photoUrl = computed(() => {
  if (!props.developer.photo) {
    return ''
  }

  return props.developer.photo.startsWith('http')
    ? props.developer.photo
    : `${config.public.apiBase}${props.developer.photo}`
})
</script>
