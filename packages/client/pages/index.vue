<script setup>
const { data: games, refresh } = await useFetch(`${useRuntimeConfig().public.apiBase}/games`)
const deletingIds = ref([])
const error = ref('')

const deleteGame = async (id) => {
  if (!confirm('Удалить эту игру? Это действие нельзя отменить.')) return
  error.value = ''
  deletingIds.value.push(id)
  try {
    const config = useRuntimeConfig()
    await $fetch(`${config.public.apiBase}/games/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e) {
    error.value = (e && (e.data?.message || e.message)) || 'Не удалось удалить игру'
  } finally {
    deletingIds.value = deletingIds.value.filter(dId => dId !== id)
  }
}
</script>

<template>
  <div>
    <div v-if="error" class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {{ error }}
    </div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Игры</h2>
      <NuxtLink to="/games/new" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors">
        Добавить игру
      </NuxtLink>
    </div>

    <div v-if="!games?.length" class="text-center py-12 text-gray-500">
      Игр пока нет. Добавьте свою первую игру, чтобы начать!
    </div>

    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <GameCard v-for="game in games" :key="game.id" :game="game" :disabled="deletingIds.includes(game.id)" @delete="deleteGame" />
    </div>
  </div>
</template>
