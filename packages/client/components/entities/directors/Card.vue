<template>
  <EntitiesCommonCard>
    <template #image>
      <div v-if="director.photo" class="flex-shrink-0 w-24 h-32">
        <img :src="photoUrl" :alt="director.fullName" class="w-full h-full object-cover" />
      </div>
      <div v-else class="flex-shrink-0 w-24 h-32 bg-gray-100 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-10 w-10 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
    </template>

    <template #title>
      <h3 class="text-lg font-semibold">
        <NuxtLink
          :to="`/movies/directors/${director.id}`"
          class="text-indigo-700 hover:text-indigo-900"
        >
          {{ director.fullName }}
        </NuxtLink>
      </h3>
    </template>

    <template #actions>
      <NuxtLink
        :to="`/movies/directors/${director.id}/edit`"
        class="text-indigo-600 hover:text-indigo-800"
        aria-label="Редактировать"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
          />
        </svg>
      </NuxtLink>
    </template>

    <template #content>
      <div class="mt-4 text-sm text-gray-600 space-y-2">
        <div class="flex items-center" v-if="director.createdAt">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4 mr-2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <UiDateDisplay :date="director.createdAt" />
        </div>
      </div>
    </template>
  </EntitiesCommonCard>
</template>

<script setup lang="ts">
interface Director {
  id: string
  fullName: string
  photo?: string | null
  createdAt?: string | null
}

const props = defineProps<{ director: Director }>()

const config = useRuntimeConfig()

const photoUrl = computed(() => {
  if (!props.director.photo) return null
  return `${config.public.apiBase}${props.director.photo}`
})
</script>
