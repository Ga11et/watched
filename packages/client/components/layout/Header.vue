<template>
  <header
    class="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <LayoutHeaderBrand />

        <LayoutHeaderDesktopNav :items="navItems" />

        <LayoutHeaderUserActions
          :is-authenticated="isAuthenticated"
          :current-user-name="currentUserName"
          :current-user-role="currentUserRole"
          :show-profile-menu="showProfileMenu"
          @toggle-profile="toggleProfileMenu"
          @close-profile="closeProfileMenu"
          @toggle-mobile="toggleMobileMenu"
          @logout="handleLogout"
        />
      </div>

      <LayoutHeaderMobileMenu
        :open="showMobileMenu"
        :nav-items="navItems"
        :add-items="addItems"
        @close="closeMobileMenu"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
interface NavItem {
  to: string
  label: string
  iconPath: string
}

interface AddItem {
  to: string
  label: string
  className: string
}

const navItems: NavItem[] = [
  { to: '/movies', label: 'Фильмы', iconPath: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4' },
  {
    to: '/series',
    label: 'Сериалы',
    iconPath: 'M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4',
  },
  {
    to: '/games',
    label: 'Игры',
    iconPath:
      'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
  },
  {
    to: '/books',
    label: 'Книги',
    iconPath:
      'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    to: '/users',
    label: 'Пользователи',
    iconPath:
      'M17 20h5v-2a4 4 0 00-5.356-3.77M17 20H7m10 0v-2c0-.654-.126-1.278-.356-1.85M7 20H2v-2a4 4 0 015.356-3.77M7 20v-2c0-.654.126-1.278.356-1.85m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

const addItems: AddItem[] = [
  {
    to: '/movies/new',
    label: '+ Добавить фильм',
    className: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
  },
  {
    to: '/series/new',
    label: '+ Добавить сериал',
    className: 'bg-orange-50 text-orange-600 hover:bg-orange-100',
  },
  {
    to: '/games/new',
    label: '+ Добавить игру',
    className: 'bg-green-50 text-green-600 hover:bg-green-100',
  },
  {
    to: '/books/new',
    label: '+ Добавить книгу',
    className: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  },
]

const auth = useAuth()

const showProfileMenu = ref(false)
const showMobileMenu = ref(false)

const isAuthenticated = computed(() => auth.isAuthenticated.value)
const currentUserName = computed(() => auth.user.value?.name ?? 'Пользователь')
const currentUserRole = computed(() => {
  const role = auth.user.value?.role
  if (!role) {
    return ''
  }

  return role === 'GUEST' ? 'Гость' : role
})

const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

const closeProfileMenu = () => {
  showProfileMenu.value = false
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
}

const handleLogout = async () => {
  auth.logout()
  showProfileMenu.value = false
  await navigateTo('/login')
}
</script>
