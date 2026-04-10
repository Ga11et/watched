<template>
  <div class="flex gap-6">
    <EntitiesAuthorsOutputsCover :photo="author.photo" :alt="author.fullName" />

    <div class="flex-1">
      <CommonOutputsConfigurableFields :config="outputLayout">
        <template #fullName>
          <div>
            <div class="text-sm text-gray-500">Имя</div>
            <div class="text-xl font-medium text-gray-900">{{ author.fullName }}</div>
          </div>
        </template>

        <template v-if="author.comment" #comment>
          <EntitiesCommonCommentBlock :comment="author.comment" />
        </template>

        <template #createdAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Создано</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="author.createdAt" /></div>
          </div>
        </template>

        <template #updatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Обновлено</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="author.updatedAt" /></div>
          </div>
        </template>
      </CommonOutputsConfigurableFields>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Author } from '~/types/api'

interface OutputFieldConfig {
  id: string
}

interface OutputRowConfig {
  columns?: number
  fields: OutputFieldConfig[]
}

interface Props {
  author: Author
}

const props = defineProps<Props>()

const outputLayout: OutputRowConfig[] = [
  { columns: 1, fields: [{ id: 'fullName' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
  { columns: 2, fields: [{ id: 'createdAt' }, { id: 'updatedAt' }] },
]
</script>
