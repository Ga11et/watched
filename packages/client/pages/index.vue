<script setup>
const { data: games, refresh } = await useFetch('/api/games')

const deleteGame = async (id) => {
  if (confirm('Are you sure you want to delete this game?')) {
    await $fetch(`/api/games/${id}`, {
      method: 'DELETE'
    })
    refresh()
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">My Games</h2>
      <NuxtLink to="/games/new" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
        Add Game
      </NuxtLink>
    </div>

    <div v-if="!games?.length" class="text-center py-12 text-gray-500">
      No games added yet. Add your first game to get started!
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="game in games" :key="game.id" class="bg-white rounded-lg shadow overflow-hidden">
        <div class="p-6">
          <div class="flex justify-between items-start">
            <h3 class="text-xl font-semibold">
              <NuxtLink :to="`/games/${game.id}`" class="text-indigo-700 hover:text-indigo-900">
                {{ game.title }}
              </NuxtLink>
            </h3>
            <div class="flex space-x-2">
              <NuxtLink :to="`/games/${game.id}/edit`" class="text-indigo-600 hover:text-indigo-800">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </NuxtLink>
              <button @click="deleteGame(game.id)" class="text-red-600 hover:text-red-800">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="mt-4 text-sm text-gray-600 space-y-2">
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ new Date(game.completionDate).toLocaleDateString() }}
            </div>
            <div class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {{ game.playTimeHours }} hours
            </div>
            <div v-if="game.rating" class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {{ game.rating }}/100
            </div>
          </div>
          
          <p v-if="game.comment" class="mt-4 text-sm text-gray-700">
            {{ game.comment }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
