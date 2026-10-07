<template>
  <EntitiesCommonCard>
    <template #image>
      <EntitiesMoviesOutputsPoster
        :poster="userMovie.movie.poster"
        :alt="userMovie.movie.title"
        size="sm"
      />
    </template>

    <template #title>
      <h3 class="line-clamp-1 text-lg font-semibold">
        <NuxtLink
          :to="`/user-movies/${userMovie.id}`"
          class="text-indigo-700 hover:text-indigo-900"
        >
          {{ userMovie.movie.title }}
        </NuxtLink>
      </h3>
    </template>

    <template #content>
      <div class="mt-2 space-y-1 text-sm text-gray-600">
        <div v-if="userMovie.movie.releaseYear != null">
          Год выхода: {{ userMovie.movie.releaseYear }}
        </div>
        <div v-if="userMovie.rating != null">Оценка: {{ userMovie.rating }}/100</div>
        <div v-if="userMovie.watchedAt" class="flex items-center gap-2">
          <span>Просмотрено:</span>
          <UiDateDisplay :date="userMovie.watchedAt" />
        </div>
      </div>
    </template>

    <template #actions>
      <div class="ml-2 flex shrink-0 flex-col items-end gap-2">
        <NuxtLink
          :to="`/user-movies/${userMovie.id}/edit`"
          class="text-sm text-indigo-700 hover:underline"
        >
          Редактировать
        </NuxtLink>
      </div>
    </template>
  </EntitiesCommonCard>
</template>

<script setup lang="ts">
import type { UserMovie } from '~/types/api'

defineProps<{ userMovie: UserMovie }>()
</script>
