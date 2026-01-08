<script setup>
const config = useRuntimeConfig()

// Fetch dashboard data
const {
  data: dashboardData,
  pending,
  error,
} = await useAsyncData('dashboard', async () => {
  try {
    const [moviesResponse, gamesResponse, directorsResponse] = await Promise.all([
      $fetch(`${config.public.apiBase}/movies?limit=5`),
      $fetch(`${config.public.apiBase}/games?limit=5`),
      $fetch(`${config.public.apiBase}/directors?limit=5`),
    ])

    // Calculate statistics
    const [allMovies, allGames, allDirectors] = await Promise.all([
      $fetch(`${config.public.apiBase}/movies/stats`),
      $fetch(`${config.public.apiBase}/games/stats`),
      $fetch(`${config.public.apiBase}/directors/stats`),
    ])

    return {
      recentMovies: moviesResponse.data || [],
      recentGames: gamesResponse.data || [],
      recentDirectors: directorsResponse.data || [],
      stats: {
        movies: allMovies,
        games: allGames,
        directors: allDirectors,
      },
    }
  } catch (e) {
    console.error('Dashboard data fetch error:', e)
    return {
      recentMovies: [],
      recentGames: [],
      recentDirectors: [],
      stats: {
        movies: { total: 0, thisMonth: 0, avgRating: 0 },
        games: { total: 0, thisMonth: 0, avgRating: 0 },
        directors: { total: 0 },
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
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Movies Stats -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Фильмы</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">
                {{ dashboardData.stats.movies.total }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                +{{ dashboardData.stats.movies.thisMonth }} за месяц
              </p>
            </div>
            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"
                />
              </svg>
            </div>
          </div>
          <div class="mt-4 flex items-center text-xs text-gray-500">
            <span>Средняя оценка:</span>
            <span class="ml-1 font-medium text-gray-700">
              {{ dashboardData.stats.movies.avgRating?.toFixed(1) || '0' }}/100
            </span>
          </div>
        </div>

        <!-- Games Stats -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Игры</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">
                {{ dashboardData.stats.games.total }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                +{{ dashboardData.stats.games.thisMonth }} за месяц
              </p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                />
              </svg>
            </div>
          </div>
          <div class="mt-4 flex items-center text-xs text-gray-500">
            <span>Средняя оценка:</span>
            <span class="ml-1 font-medium text-gray-700">
              {{ dashboardData.stats.games.avgRating?.toFixed(1) || '0' }}/100
            </span>
          </div>
        </div>

        <!-- Directors Stats -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Режиссёры</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">
                {{ dashboardData.stats.directors.total }}
              </p>
              <p class="text-xs text-gray-500 mt-1">В коллекции</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          </div>
          <div class="mt-4 flex items-center text-xs text-gray-500">
            <span>Уникальные режиссёры</span>
          </div>
        </div>
      </div>

      <!-- Recent Content -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Recent Movies -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Последние фильмы</h3>
              <NuxtLink
                to="/movies"
                class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Все фильмы
                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </NuxtLink>
            </div>
          </div>
          <div class="p-6">
            <div
              v-if="dashboardData.recentMovies.length === 0"
              class="text-center py-8 text-gray-500"
            >
              <svg
                class="w-12 h-12 mx-auto text-gray-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"
                />
              </svg>
              <p>Фильмы не найдены</p>
              <NuxtLink
                to="/movies/new"
                class="inline-flex items-center mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                Добавить фильм
              </NuxtLink>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="movie in dashboardData.recentMovies"
                :key="movie.id"
                class="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div
                  class="w-12 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <NuxtLink
                    :to="`/movies/${movie.id}`"
                    class="text-sm font-medium text-gray-900 truncate hover:text-indigo-600"
                  >
                    {{ movie.title }}
                  </NuxtLink>
                  <div class="flex items-center space-x-2 mt-1">
                    <span class="text-xs text-gray-500">{{ formatDate(movie.watchedAt) }}</span>
                    <span v-if="movie.rating" class="text-xs text-indigo-600 font-medium">
                      ★ {{ movie.rating }}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Games -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Последние игры</h3>
              <NuxtLink
                to="/games"
                class="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Все игры
                <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </NuxtLink>
            </div>
          </div>
          <div class="p-6">
            <div
              v-if="dashboardData.recentGames.length === 0"
              class="text-center py-8 text-gray-500"
            >
              <svg
                class="w-12 h-12 mx-auto text-gray-300 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                />
              </svg>
              <p>Игры не найдены</p>
              <NuxtLink
                to="/games/new"
                class="inline-flex items-center mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                Добавить игру
              </NuxtLink>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="game in dashboardData.recentGames"
                :key="game.id"
                class="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div
                  class="w-12 h-12 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center"
                >
                  <svg
                    class="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <NuxtLink
                    :to="`/games/${game.id}`"
                    class="text-sm font-medium text-gray-900 truncate hover:text-indigo-600"
                  >
                    {{ game.title }}
                  </NuxtLink>
                  <div class="flex items-center space-x-2 mt-1">
                    <span v-if="game.completionDate" class="text-xs text-gray-500">
                      {{ formatDate(game.completionDate) }}
                    </span>
                    <span v-if="game.rating" class="text-xs text-green-600 font-medium">
                      ★ {{ game.rating }}/100
                    </span>
                    <span v-if="game.playTimeHours" class="text-xs text-gray-500">
                      {{ game.playTimeHours }}ч
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
            to="/movies/directors/new"
            class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <svg
              class="w-8 h-8 text-purple-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span class="text-sm font-medium text-purple-900">Добавить режиссёра</span>
          </NuxtLink>
          <NuxtLink
            to="/movies"
            class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg
              class="w-8 h-8 text-gray-600 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span class="text-sm font-medium text-gray-900">Статистика</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
