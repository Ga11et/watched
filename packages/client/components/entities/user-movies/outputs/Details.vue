<template>
  <div class="flex flex-col gap-6 sm:flex-row">
    <EntitiesMoviesOutputsPoster :poster="userMovie.movie.poster" :alt="userMovie.movie.title" />

    <div class="min-w-0 flex-1">
      <CommonOutputsConfigurableFields :config="outputLayout">
        <template #movieTitle>
          <div>
            <div class="text-sm text-gray-500">Название</div>
            <div class="text-xl font-medium text-gray-900">{{ userMovie.movie.title }}</div>
          </div>
        </template>

        <template #directors>
          <div>
            <div class="text-sm text-gray-500">Режиссёры</div>
            <div v-if="userMovie.movie.directors?.length" class="mt-1 flex flex-wrap gap-2">
              <NuxtLink
                v-for="director in userMovie.movie.directors"
                :key="director.id"
                :to="`/movies/directors/${director.id}`"
                class="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
              >
                {{ director.fullName }}
              </NuxtLink>
            </div>
            <div v-else class="text-base text-gray-900">—</div>
          </div>
        </template>

        <template #genre>
          <div>
            <div class="text-sm text-gray-500">Жанр</div>
            <div class="text-base text-gray-900">{{ userMovie.movie.genre ?? '—' }}</div>
          </div>
        </template>

        <template #releaseYear>
          <div>
            <div class="text-sm text-gray-500">Год выхода</div>
            <div class="text-base text-gray-900">{{ userMovie.movie.releaseYear ?? '—' }}</div>
          </div>
        </template>

        <template #rating>
          <div>
            <div class="text-sm text-gray-500">Оценка</div>
            <div class="text-base text-gray-900">
              {{ userMovie.rating != null ? `${userMovie.rating}/100` : '—' }}
            </div>
          </div>
        </template>

        <template #watchedAt>
          <div>
            <div class="text-sm text-gray-500">Дата просмотра</div>
            <div class="text-base text-gray-900">
              <UiDateDisplay v-if="userMovie.watchedAt" :date="userMovie.watchedAt" />
              <span v-else>—</span>
            </div>
          </div>
        </template>

        <template #comment>
          <EntitiesCommonCommentBlock v-if="userMovie.comment" :comment="userMovie.comment" />
          <div v-else>
            <div class="text-sm text-gray-500">Комментарий</div>
            <div class="text-base text-gray-900">—</div>
          </div>
        </template>

        <template #createdAt>
          <div>
            <div class="text-sm text-gray-500">Создана запись</div>
            <UiDateDisplay :date="userMovie.createdAt" />
          </div>
        </template>

        <template #updatedAt>
          <div>
            <div class="text-sm text-gray-500">Обновлена запись</div>
            <UiDateDisplay :date="userMovie.updatedAt" />
          </div>
        </template>
      </CommonOutputsConfigurableFields>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UserMovie } from '~/types/api'

defineProps<{ userMovie: UserMovie }>()

const outputLayout = [
  { columns: 1, fields: [{ id: 'movieTitle' }] },
  { columns: 2, fields: [{ id: 'directors' }, { id: 'genre' }] },
  { columns: 1, fields: [{ id: 'releaseYear' }] },
  { columns: 2, fields: [{ id: 'rating' }, { id: 'watchedAt' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
  { columns: 2, fields: [{ id: 'createdAt' }, { id: 'updatedAt' }] },
]
</script>
