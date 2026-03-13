interface AuthUser {
  id: string
  username: string | null
  email: string | null
  name: string
  role: 'ADMIN' | 'USER' | 'GUEST'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AuthResponse {
  token: string
  user: AuthUser
}

interface RegisterPayload {
  name: string
  username?: string
  email?: string
  password: string
}

interface LoginPayload {
  identifier: string
  password: string
}

const AUTH_TOKEN_COOKIE = 'watched.auth.token'

const getApiErrorMessage = (error: unknown): string => {
  const fallback = 'Не удалось выполнить запрос. Попробуйте еще раз.'

  if (!error || typeof error !== 'object') {
    return fallback
  }

  const withData = error as { data?: { message?: string | string[] } }
  const message = withData.data?.message

  if (Array.isArray(message) && message.length > 0) {
    return String(message[0])
  }

  if (typeof message === 'string' && message.trim().length > 0) {
    return message
  }

  return fallback
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const tokenCookie = useCookie<string | null>(AUTH_TOKEN_COOKIE, {
    sameSite: 'lax',
    path: '/',
    default: () => null,
  })

  const token = useState<string | null>('auth:token', () => tokenCookie.value ?? null)
  const user = useState<AuthUser | null>('auth:user', () => null)
  const initialized = useState<boolean>('auth:initialized', () => false)

  const persistToken = () => {
    tokenCookie.value = token.value
  }

  const initFromStorage = async () => {
    if (initialized.value) {
      return
    }

    token.value = tokenCookie.value ?? null

    if (!token.value) {
      user.value = null
      initialized.value = true
      return
    }

    try {
      const me = await _fetch<AuthUser>(`${config.public.apiBase}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      user.value = me
    } catch {
      token.value = null
      user.value = null
      persistToken()
    }

    initialized.value = true
  }

  const setSession = (payload: AuthResponse) => {
    token.value = payload.token
    user.value = payload.user
    persistToken()
    initialized.value = true
  }

  const login = async (payload: LoginPayload) => {
    const response = await _fetch<AuthResponse>(`${config.public.apiBase}/auth/login`, {
      method: 'POST',
      body: payload,
    })

    setSession(response)
    return response
  }

  const register = async (payload: RegisterPayload) => {
    const response = await _fetch<AuthResponse>(`${config.public.apiBase}/auth/register`, {
      method: 'POST',
      body: payload,
    })

    setSession(response)
    return response
  }

  const loginAsGuest = () => {
    token.value = null
    user.value = {
      id: 'guest',
      username: 'guest',
      email: null,
      name: 'Guest',
      role: 'GUEST',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    persistToken()
    initialized.value = true
  }

  const logout = () => {
    token.value = null
    user.value = null
    persistToken()
    initialized.value = true
  }

  const authHeaders = computed<Record<string, string>>(() => {
    const headers: Record<string, string> = {}

    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }

    return headers
  })

  const isAuthenticated = computed(() => Boolean(user.value))
  const isGuest = computed(() => user.value?.role === 'GUEST')

  return {
    token,
    user,
    isAuthenticated,
    isGuest,
    authHeaders,
    initFromStorage,
    login,
    register,
    loginAsGuest,
    logout,
    getApiErrorMessage,
  }
}
