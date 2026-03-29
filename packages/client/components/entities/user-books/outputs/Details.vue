<template>
  <div class="flex gap-6">
    <EntitiesBooksOutputsCover :cover="userBook.book.cover" :alt="userBook.book.title" />

    <div class="flex-1">
      <CommonOutputsConfigurableFields :config="outputLayout">
        <template #bookTitle>
          <div>
            <div class="text-sm text-gray-500">Название</div>
            <div class="text-xl font-medium text-gray-900">{{ userBook.book.title }}</div>
          </div>
        </template>

        <template #author>
          <div>
            <div class="text-sm text-gray-500">Автор</div>
            <div class="mt-1 flex flex-wrap gap-2" v-if="userBook.book.authors?.length">
              <NuxtLink
                v-for="author in userBook.book.authors"
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
            <div class="text-base text-gray-900">{{ userBook.book.genre ?? '—' }}</div>
          </div>
        </template>

        <template #publishYear>
          <div>
            <div class="text-sm text-gray-500">Год издания</div>
            <div class="text-base text-gray-900">{{ userBook.book.publishYear ?? '—' }}</div>
          </div>
        </template>

        <template #pageCount>
          <div>
            <div class="text-sm text-gray-500">Количество страниц</div>
            <div class="text-base text-gray-900">{{ userBook.book.pageCount ?? '—' }}</div>
          </div>
        </template>

        <template #bookRating>
          <div>
            <div class="text-sm text-gray-500">Оценка книги</div>
            <div class="text-base text-gray-900">
              {{ userBook.rating != null ? `${userBook.rating}/100` : '—' }}
            </div>
          </div>
        </template>

        <template #bookReadAt>
          <div>
            <div class="text-sm text-gray-500">Дата прочтения</div>
            <div class="text-base text-gray-900">
              <UiDateDisplay v-if="userBook.readAt" :date="userBook.readAt" />
              <span v-else>—</span>
            </div>
          </div>
        </template>

        <template v-if="userBook.comment" #bookComment>
          <EntitiesCommonCommentBlock :comment="userBook.comment" />
        </template>

        <template #bookCreatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Создана карточка книги</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="userBook.createdAt" /></div>
          </div>
        </template>

        <template #bookUpdatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Обновлена карточка книги</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="userBook.updatedAt" /></div>
          </div>
        </template>
      </CommonOutputsConfigurableFields>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserBook } from '~/types/api'

interface OutputFieldConfig {
  id: string
}

interface OutputRowConfig {
  columns?: number
  fields: OutputFieldConfig[]
}

interface Props {
  userBook: UserBook
}

const props = defineProps<Props>()

const outputLayout: OutputRowConfig[] = [
  { columns: 1, fields: [{ id: 'bookTitle' }] },
  { columns: 2, fields: [{ id: 'author' }, { id: 'genre' }] },
  { columns: 2, fields: [{ id: 'publishYear' }, { id: 'pageCount' }] },
  { columns: 2, fields: [{ id: 'bookRating' }, { id: 'bookReadAt' }] },
  { columns: 1, fields: [{ id: 'bookComment' }] },
  { columns: 2, fields: [{ id: 'bookCreatedAt' }, { id: 'bookUpdatedAt' }] },
]
</script>
