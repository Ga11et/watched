<template>
  <header
    class="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo and Brand -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-3 group">
            <div
              class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
            >
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
            <div>
              <h1
                class="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
              >
                Watched
              </h1>
              <p class="text-xs text-gray-500">Коллекция медиа</p>
            </div>
          </NuxtLink>
        </div>

        <!-- Navigation -->
        <nav class="hidden lg:flex items-center space-x-1">
          <NuxtLink
            to="/movies"
            class="nav-link"
            :class="{ 'nav-link-active': $route.path.startsWith('/movies') }"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"
              />
            </svg>
            Фильмы
          </NuxtLink>
          <NuxtLink
            to="/series"
            class="nav-link"
            :class="{ 'nav-link-active': $route.path.startsWith('/series') }"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4"
              />
            </svg>
            Сериалы
          </NuxtLink>
          <NuxtLink
            to="/games"
            class="nav-link"
            :class="{ 'nav-link-active': $route.path.startsWith('/games') }"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
              />
            </svg>
            Игры
          </NuxtLink>
          <NuxtLink
            to="/books"
            class="nav-link"
            :class="{ 'nav-link-active': $route.path.startsWith('/books') }"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Книги
          </NuxtLink>
        </nav>

        <!-- Right side: Profile -->
        <div class="flex items-center space-x-3">
          <!-- Profile Section -->
          <div class="relative">
            <button
              type="button"
              class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hover:bg-gray-100 p-1 transition-colors"
              @click="toggleProfileMenu"
            >
              <div
                class="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-sm"
              >
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </button>

            <!-- Profile Dropdown -->
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showProfileMenu"
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-100"
                @click.away="showProfileMenu = false"
              >
                <div class="py-2">
                  <div class="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 font-medium">
                    Профиль
                  </div>
                  <a href="#" class="dropdown-item">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Настройки
                  </a>
                  <a href="#" class="dropdown-item">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Статистика
                  </a>
                  <div class="border-t border-gray-100 mt-2 pt-2">
                    <a href="#" class="dropdown-item text-red-600 hover:bg-red-50">
                      <svg
                        class="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Выйти
                    </a>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Mobile menu button -->
          <button
            type="button"
            class="lg:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
            @click="toggleMobileMenu"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-y-95 opacity-0"
        enter-to-class="transform scale-y-100 opacity-100"
        leave-active-class="transition duration-75 ease-in"
        leave-from-class="transform scale-y-100 opacity-100"
        leave-to-class="transform scale-y-95 opacity-0"
      >
        <div
          v-if="showMobileMenu"
          class="lg:hidden border-t border-gray-200/50 bg-white/80 backdrop-blur-sm"
        >
          <div class="px-2 pt-2 pb-3 space-y-1">
            <NuxtLink to="/movies" class="mobile-nav-link" @click="showMobileMenu = false">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4"
                />
              </svg>
              Фильмы
            </NuxtLink>
            <NuxtLink to="/series" class="mobile-nav-link" @click="showMobileMenu = false">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4"
                />
              </svg>
              Сериалы
            </NuxtLink>
            <NuxtLink to="/games" class="mobile-nav-link" @click="showMobileMenu = false">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                />
              </svg>
              Игры
            </NuxtLink>
            <NuxtLink to="/books" class="mobile-nav-link" @click="showMobileMenu = false">
              <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Книги
            </NuxtLink>
            <div class="pt-4 pb-3 border-t border-gray-200/50 mt-4">
              <div class="px-3 space-y-2">
                <NuxtLink
                  to="/movies/new"
                  class="mobile-add-btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  @click="showMobileMenu = false"
                >
                  + Добавить фильм
                </NuxtLink>
                <NuxtLink
                  to="/series/new"
                  class="mobile-add-btn bg-orange-50 text-orange-600 hover:bg-orange-100"
                  @click="showMobileMenu = false"
                >
                  + Добавить сериал
                </NuxtLink>
                <NuxtLink
                  to="/games/new"
                  class="mobile-add-btn bg-green-50 text-green-600 hover:bg-green-100"
                  @click="showMobileMenu = false"
                >
                  + Добавить игру
                </NuxtLink>
                <NuxtLink
                  to="/books/new"
                  class="mobile-add-btn bg-blue-50 text-blue-600 hover:bg-blue-100"
                  @click="showMobileMenu = false"
                >
                  + Добавить книгу
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </header>
</template>

<script setup lang="ts">
const showProfileMenu = ref(false)
const showMobileMenu = ref(false)

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}
</script>

<style scoped>
.nav-link {
  @apply flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-lg transition-all duration-200 hover:text-gray-900 hover:bg-gray-100;
}

.nav-link-active {
  @apply text-indigo-600 bg-indigo-50 hover:bg-indigo-100;
}

.quick-add-btn {
  @apply flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200;
}

.dropdown-item {
  @apply flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors;
}

.mobile-nav-link {
  @apply flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors;
}

.mobile-add-btn {
  @apply block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors;
}
</style>
