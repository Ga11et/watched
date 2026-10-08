<template>
  <div class="flex gap-6">
    <EntitiesMoviesOutputsPoster :poster="movie.poster" :alt="movie.title" />

    <div class="flex-1">
      <CommonOutputsConfigurableFields :config="outputLayout">
        <template #title>
          <div>
            <div class="text-sm text-gray-500">Название</div>
            <div class="text-xl font-medium text-gray-900">{{ movie.title }}</div>
          </div>
        </template>

        <template #directors>
          <div>
            <div class="text-sm text-gray-500">Режиссёры</div>
            <div v-if="movie.directors.length" class="mt-1 flex flex-wrap gap-2">
              <NuxtLink
                v-for="director in movie.directors"
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
            <div class="text-base text-gray-900">{{ movie.genre ?? '—' }}</div>
          </div>
        </template>

        <template #releaseYear>
          <div>
            <div class="text-sm text-gray-500">Год выхода</div>
            <div class="text-base text-gray-900">{{ movie.releaseYear ?? '—' }}</div>
          </div>
        </template>

        <template #createdAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Создано</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="movie.createdAt" /></div>
          </div>
        </template>

        <template #updatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Обновлено</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="movie.updatedAt" /></div>
          </div>
        </template>
      </CommonOutputsConfigurableFields>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Movie } from '~/types/api'

defineProps<{ movie: Movie }>()

const outputLayout = [
  { columns: 1, fields: [{ id: 'title' }] },
  { columns: 2, fields: [{ id: 'directors' }, { id: 'genre' }] },
  { columns: 1, fields: [{ id: 'releaseYear' }] },
  { columns: 2, fields: [{ id: 'createdAt' }, { id: 'updatedAt' }] },
]
</script>
