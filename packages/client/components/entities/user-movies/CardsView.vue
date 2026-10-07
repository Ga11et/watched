<template>
  <TransitionGroup name="cards-list" tag="div" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <EntitiesUserMoviesCard
      v-for="userMovie in movies"
      :key="userMovie.id"
      :user-movie="userMovie"
    />
  </TransitionGroup>
</template>

<script setup lang="ts">
import type { UserMovie } from '~/types/api'

defineProps<{ movies: UserMovie[] }>()
</script>
