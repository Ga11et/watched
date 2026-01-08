<template>
  <header class="bg-white border-b border-gray-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo and Brand -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <h1 class="text-xl font-bold text-gray-900">Watched</h1>
              <p class="text-xs text-gray-500">Отслеживайте коллекцию</p>
            </div>
          </NuxtLink>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-8">
          <NuxtLink
            to="/movies"
            class="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
            :class="{
              'text-indigo-600 border-b-2 border-indigo-600':
                $route.path.startsWith('/movies') && !$route.path.startsWith('/movies/directors'),
            }"
          >
            Фильмы
          </NuxtLink>
          <NuxtLink
            to="/games"
            class="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
            :class="{
              'text-indigo-600 border-b-2 border-indigo-600': $route.path.startsWith('/games'),
            }"
          >
            Игры
          </NuxtLink>
          <NuxtLink
            to="/movies/directors"
            class="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium transition-colors"
            :class="{
              'text-indigo-600 border-b-2 border-indigo-600':
                $route.path.startsWith('/movies/directors'),
            }"
          >
            Режиссёры
          </NuxtLink>
        </nav>

        <!-- Right side: Profile/Actions -->
        <div class="flex items-center space-x-4">
          <!-- Add new buttons -->
          <div class="hidden sm:flex items-center space-x-2">
            <NuxtLink
              to="/movies/new"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Фильм
            </NuxtLink>
            <NuxtLink
              to="/games/new"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Игра
            </NuxtLink>
          </div>

          <!-- Profile Section (Placeholder for future functionality) -->
          <div class="relative">
            <button
              type="button"
              class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              @click="toggleProfileMenu"
            >
              <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </button>

            <!-- Profile Dropdown (Placeholder) -->
            <div
              v-if="showProfileMenu"
              class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
              @click.away="showProfileMenu = false"
            >
              <div class="py-1">
                <div class="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                  Профиль (в разработке)
                </div>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Настройки
                </a>
                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Статистика
                </a>
                <div class="border-t border-gray-100">
                  <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Выйти
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile menu button -->
          <button
            type="button"
            class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
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
      <div v-if="showMobileMenu" class="md:hidden border-t border-gray-200">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <NuxtLink
            to="/movies"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            @click="showMobileMenu = false"
          >
            Фильмы
          </NuxtLink>
          <NuxtLink
            to="/games"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            @click="showMobileMenu = false"
          >
            Игры
          </NuxtLink>
          <NuxtLink
            to="/movies/directors"
            class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            @click="showMobileMenu = false"
          >
            Режиссёры
          </NuxtLink>
          <div class="pt-4 pb-3 border-t border-gray-200">
            <div class="px-3 space-y-2">
              <NuxtLink
                to="/movies/new"
                class="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                @click="showMobileMenu = false"
              >
                + Добавить фильм
              </NuxtLink>
              <NuxtLink
                to="/games/new"
                class="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100"
                @click="showMobileMenu = false"
              >
                + Добавить игру
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
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
