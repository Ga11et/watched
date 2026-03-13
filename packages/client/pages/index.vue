<script setup>
const config = useRuntimeConfig()

// Fetch dashboard data
const {
  data: dashboardData,
  pending,
  error,
} = await useAsyncData('dashboard', async () => {
  try {
    const [moviesResponse, gamesResponse, booksResponse, seriesResponse] = await Promise.all([
      _fetch(`${config.public.apiBase}/movies?limit=5`),
      _fetch(`${config.public.apiBase}/games?limit=5`),
      _fetch(`${config.public.apiBase}/books?limit=5`),
      _fetch(`${config.public.apiBase}/series?limit=5`),
    ])

    // Calculate statistics
    const [allMovies, allGames, allBooks, allSeries] = await Promise.all([
      _fetch(`${config.public.apiBase}/movies/stats`),
      _fetch(`${config.public.apiBase}/games/stats`),
      _fetch(`${config.public.apiBase}/books/stats`),
      _fetch(`${config.public.apiBase}/series/stats`),
    ])

    return {
      recentMovies: moviesResponse.data || [],
      recentGames: gamesResponse.data || [],
      recentBooks: booksResponse.data || [],
      recentSeries: seriesResponse.data || [],
      stats: {
        movies: allMovies,
        games: allGames,
        books: allBooks,
        series: allSeries,
      },
    }
  } catch (e) {
    console.error('Dashboard data fetch error:', e)
    return {
      recentMovies: [],
      recentGames: [],
      recentBooks: [],
      recentSeries: [],
      stats: {
        movies: { total: 0, thisMonth: 0, avgRating: 0 },
        games: { total: 0, thisMonth: 0, avgRating: 0 },
        books: { total: 0, thisMonth: 0, avgRating: 0 },
        series: { total: 0, thisMonth: 0, avgRating: 0 },
      },
    }
  }
})

// Format date helper
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}
</script>

<template>
  <div>
    <!-- Error State -->
    <div
      v-if="error"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      Не удалось загрузить данные дашборда
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="text-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"
      ></div>
      <p class="mt-2 text-gray-500">Загрузка дашборда...</p>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="dashboardData">
      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Movies Stats -->
        <EntitiesMoviesStats :stats="dashboardData.stats.movies" />

        <!-- Games Stats -->
        <EntitiesGamesStats :stats="dashboardData.stats.games" />

        <!-- Books Stats -->
        <EntitiesBooksStats :stats="dashboardData.stats.books" />

        <!-- Series Stats -->
        <EntitiesSeriesStats :stats="dashboardData.stats.series" />
      </div>

      <!-- Quick Actions -->
      <div class="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NuxtLink
            to="/movies/new"
            class="flex flex-col items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <svg
              class="w-8 h-8 text-indigo-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span class="text-sm font-medium text-indigo-900">Добавить фильм</span>
          </NuxtLink>
          <NuxtLink
            to="/games/new"
            class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <svg
              class="w-8 h-8 text-green-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span class="text-sm font-medium text-green-900">Добавить игру</span>
          </NuxtLink>
          <NuxtLink
            to="/series/new"
            class="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <svg
              class="w-8 h-8 text-orange-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span class="text-sm font-medium text-orange-900">Добавить сериал</span>
          </NuxtLink>
          <NuxtLink
            to="/books/new"
            class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg
              class="w-8 h-8 text-blue-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span class="text-sm font-medium text-blue-900">Добавить книгу</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
