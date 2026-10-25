export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  const hadToken = Boolean(auth.token.value)

  try {
    await auth.initFromStorage()
  } catch {
    // Сеть/5xx при проверке auth/me: токен сохранён, защищённая страница не открывается,
    // пользователь может повторить проверку со страницы ошибки.
    return abortNavigation(
      createError({
        statusCode: 503,
        statusMessage: 'Session check failed',
        data: {
          title: 'Не удалось проверить сессию',
          description: 'Проверьте соединение и повторите попытку.',
        },
        fatal: true,
      }),
    )
  }

  if (!auth.isAuthenticated.value && to.path !== '/login') {
    return navigateTo(loginRoute(to.fullPath, hadToken ? SESSION_EXPIRED_REASON : undefined))
  }

  if (auth.isAuthenticated.value && to.path === '/login') {
    return navigateTo('/')
  }
})
