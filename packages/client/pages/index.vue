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
      $fetch(`${config.public.apiBase}/movies?limit=5`),
      $fetch(`${config.public.apiBase}/games?limit=5`),
      $fetch(`${config.public.apiBase}/books?limit=5`),
      $fetch(`${config.public.apiBase}/series?limit=5`),
    ])

    // Calculate statistics
    const [allMovies, allGames, allBooks, allSeries] = await Promise.all([
      $fetch(`${config.public.apiBase}/movies/stats`),
      $fetch(`${config.public.apiBase}/games/stats`),
      $fetch(`${config.public.apiBase}/books/stats`),
      $fetch(`${config.public.apiBase}/series/stats`),
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

        <!-- Books Stats -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Книги</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">
                {{ dashboardData.stats.books.total }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                +{{ dashboardData.stats.books.thisMonth }} за месяц
              </p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
          <div class="mt-4 flex items-center text-xs text-gray-500">
            <span>Средняя оценка:</span>
            <span class="ml-1 font-medium text-gray-700">
              {{ dashboardData.stats.books.avgRating?.toFixed(1) || '0' }}/100
            </span>
          </div>
        </div>

        <!-- Series Stats -->
        <div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Сериалы</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">
                {{ dashboardData.stats.series.total }}
              </p>
              <p class="text-xs text-gray-500 mt-1">
                +{{ dashboardData.stats.series.thisMonth }} за месяц
              </p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg
                class="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4"
                />
              </svg>
            </div>
          </div>
          <div class="mt-4 flex items-center text-xs text-gray-500">
            <span>Средняя оценка:</span>
            <span class="ml-1 font-medium text-gray-700">
              {{ dashboardData.stats.series.avgRating?.toFixed(1) || '0' }}/10
            </span>
          </div>
        </div>
      </div>

      <!-- Recent Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <!-- Recent Books -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Последние книги</h3>
              <NuxtLink
                to="/books"
                class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Все книги
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
              v-if="dashboardData.recentBooks.length === 0"
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
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p>Книги не найдены</p>
              <NuxtLink
                to="/books/new"
                class="inline-flex items-center mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Добавить книгу
              </NuxtLink>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="book in dashboardData.recentBooks"
                :key="book.id"
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
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <NuxtLink
                    :to="`/books/${book.id}`"
                    class="text-sm font-medium text-gray-900 truncate hover:text-blue-600"
                  >
                    {{ book.title }}
                  </NuxtLink>
                  <div class="flex items-center space-x-2 mt-1">
                    <span v-if="book.readAt" class="text-xs text-gray-500">
                      {{ formatDate(book.readAt) }}
                    </span>
                    <span v-if="book.rating" class="text-xs text-blue-600 font-medium">
                      ★ {{ book.rating }}/100
                    </span>
                    <span v-if="book.pageCount" class="text-xs text-gray-500">
                      {{ book.pageCount }} стр.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Series -->
        <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div class="p-6 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Последние сериалы</h3>
              <NuxtLink
                to="/series"
                class="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                Все сериалы
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
              v-if="dashboardData.recentSeries.length === 0"
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
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4"
                />
              </svg>
              <p>Сериалы не найдены</p>
              <NuxtLink
                to="/series/new"
                class="inline-flex items-center mt-3 px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
              >
                Добавить сериал
              </NuxtLink>
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="series in dashboardData.recentSeries"
                :key="series.id"
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
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4"
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <NuxtLink
                    :to="`/series/${series.id}`"
                    class="text-sm font-medium text-gray-900 truncate hover:text-orange-600"
                  >
                    {{ series.title }}
                  </NuxtLink>
                  <div class="flex items-center space-x-2 mt-1">
                    <span v-if="series.watchedAt" class="text-xs text-gray-500">{{
                      formatDate(series.watchedAt)
                    }}</span>
                    <span v-if="series.rating" class="text-xs text-orange-600 font-medium">
                      ★ {{ series.rating }}/10
                    </span>
                    <span v-if="series.totalSeasons" class="text-xs text-gray-500">
                      {{ series.watchedSeasons || 0 }}/{{ series.totalSeasons }} сезонов
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
