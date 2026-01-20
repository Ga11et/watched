<template>
  <div class="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
    <h3 v-if="title" class="text-sm font-medium text-indigo-900 mb-3">{{ title }}</h3>
    <div class="flex items-start gap-4">
      <img
        v-if="person.profile_path"
        :src="`https://image.tmdb.org/t/p/w185${person.profile_path}`"
        :alt="person.name"
        class="w-20 h-28 rounded-lg object-cover shadow-sm"
      />
      <div
        v-else
        class="w-20 h-28 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400"
      >
        Нет фото
      </div>
      <div class="flex-1 text-sm">
        <p><span class="font-medium text-gray-700">Имя:</span> {{ person.name }}</p>
        <p v-if="person.known_for_department">
          <span class="font-medium text-gray-700">Деятельность:</span>
          {{ person.known_for_department }}
        </p>
        <p><span class="font-medium text-gray-700">TMDB ID:</span> {{ person.id }}</p>
        <p v-if="person.popularity">
          <span class="font-medium text-gray-700">Популярность:</span>
          {{ person.popularity.toFixed(1) }}
        </p>
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TmdbPerson } from '~/types/api'

interface Props {
  person: TmdbPerson
  title?: string
}

defineProps<Props>()
</script>
