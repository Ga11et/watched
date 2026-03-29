<template>
  <div class="flex gap-6">
    <EntitiesBooksOutputsCover :cover="book.cover" :alt="book.title" />

    <div class="flex-1">
      <CommonOutputsConfigurableFields :config="outputLayout">
        <template #title>
          <div>
            <div class="text-sm text-gray-500">Название</div>
            <div class="text-xl font-medium text-gray-900">{{ book.title }}</div>
          </div>
        </template>

        <template #author>
          <div>
            <div class="text-sm text-gray-500">Автор</div>
            <div class="mt-1 flex flex-wrap gap-2" v-if="book.authors?.length">
              <NuxtLink
                v-for="author in book.authors"
                :key="author.id"
                :to="`/books/authors/${author.id}`"
                class="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
              >
                {{ author.fullName }}
              </NuxtLink>
            </div>
            <div v-else class="text-base text-gray-900">—</div>
          </div>
        </template>

        <template #genre>
          <div>
            <div class="text-sm text-gray-500">Жанр</div>
            <div class="text-base text-gray-900">{{ book.genre ?? '—' }}</div>
          </div>
        </template>

        <template #publishYear>
          <div>
            <div class="text-sm text-gray-500">Год издания</div>
            <div class="text-base text-gray-900">{{ book.publishYear ?? '—' }}</div>
          </div>
        </template>

        <template #pageCount>
          <div>
            <div class="text-sm text-gray-500">Количество страниц</div>
            <div class="text-base text-gray-900">{{ book.pageCount ?? '—' }}</div>
          </div>
        </template>

        <template v-if="book.comment" #comment>
          <EntitiesCommonCommentBlock :comment="book.comment" />
        </template>

        <template #createdAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Создано</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="book.createdAt" /></div>
          </div>
        </template>

        <template #updatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Обновлено</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="book.updatedAt" /></div>
          </div>
        </template>
      </CommonOutputsConfigurableFields>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Book } from '~/types/api'

interface OutputFieldConfig {
  id: string
}

interface OutputRowConfig {
  columns?: number
  fields: OutputFieldConfig[]
}

interface Props {
  book: Book
}

const props = defineProps<Props>()

const outputLayout: OutputRowConfig[] = [
  { columns: 1, fields: [{ id: 'title' }] },
  { columns: 2, fields: [{ id: 'author' }, { id: 'genre' }] },
  { columns: 2, fields: [{ id: 'publishYear' }, { id: 'pageCount' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
  { columns: 2, fields: [{ id: 'createdAt' }, { id: 'updatedAt' }] },
]
</script>
