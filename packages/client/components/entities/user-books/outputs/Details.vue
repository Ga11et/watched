<template>
  <div class="flex gap-6">
    <div class="flex-shrink-0">
      <div v-if="userBook.book.cover" class="h-56 w-40 overflow-hidden rounded-lg">
        <img :src="coverUrl" :alt="userBook.book.title" class="h-full w-full object-cover" />
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
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
    </div>

    <div class="flex-1">
      <CommonOutputsConfigurableFields :config="outputLayout">
        <template #bookTitle>
          <div>
            <div class="text-sm text-gray-500">Название</div>
            <div class="text-xl font-medium text-gray-900">{{ userBook.book.title }}</div>
          </div>
        </template>

        <template #bookId>
          <div>
            <div class="text-sm text-gray-500">ID книги</div>
            <div class="break-all text-base text-gray-900">{{ userBook.book.id }}</div>
          </div>
        </template>

        <template #author>
          <div>
            <div class="text-sm text-gray-500">Автор</div>
            <div v-if="userBook.book.author" class="mt-1 flex flex-wrap gap-2">
              <NuxtLink
                :to="`/books/authors/${userBook.book.author.id}`"
                class="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
              >
                {{ userBook.book.author.fullName }}
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

        <template #bookComment>
          <EntitiesCommonCommentBlock :comment="userBook.comment" />
        </template>

        <template #bookCreatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Создана карточка книги</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="userBook.book.createdAt" /></div>
          </div>
        </template>

        <template #bookUpdatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Обновлена карточка книги</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="userBook.book.updatedAt" /></div>
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
const config = useRuntimeConfig()

const outputLayout: OutputRowConfig[] = [
  { columns: 2, fields: [{ id: 'bookTitle' }, { id: 'bookId' }] },
  { columns: 2, fields: [{ id: 'author' }, { id: 'genre' }] },
  { columns: 2, fields: [{ id: 'publishYear' }, { id: 'pageCount' }] },
  { columns: 2, fields: [{ id: 'bookRating' }, { id: 'bookReadAt' }] },
  { columns: 1, fields: [{ id: 'bookComment' }] },
  { columns: 2, fields: [{ id: 'bookCreatedAt' }, { id: 'bookUpdatedAt' }] },
]

const coverUrl = computed(() => {
  if (!props.userBook.book.cover) return ''
  return props.userBook.book.cover.startsWith('http')
    ? props.userBook.book.cover
    : `${config.public.apiBase}${props.userBook.book.cover}`
})
</script>
