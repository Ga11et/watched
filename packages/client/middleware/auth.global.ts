export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.initFromStorage()

  if (!auth.isAuthenticated.value && to.path !== '/login') {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (auth.isAuthenticated.value && to.path === '/login') {
    return navigateTo('/')
  }
})
