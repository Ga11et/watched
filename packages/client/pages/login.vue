<script setup lang="ts">
const route = useRoute()
const auth = useAuth()

definePageMeta({
  layout: 'auth',
})

const REGISTER_FIELDS = ['name', 'username', 'email', 'password'] as const

type RegisterErrors = Partial<Record<(typeof REGISTER_FIELDS)[number], string>>

const mode = ref<'login' | 'register'>('login')
const pending = ref(false)
const errorMessage = ref('')
const registerErrors = ref<RegisterErrors>({})

const loginForm = reactive({
  identifier: '',
  password: '',
})

const registerForm = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
})

const redirectTo = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' && value.startsWith('/') ? value : '/'
})

const noticeMessage = computed(() =>
  route.query.reason === SESSION_EXPIRED_REASON ? SESSION_EXPIRED_MESSAGE : '',
)

const submitLogin = async () => {
  pending.value = true
  errorMessage.value = ''

  try {
    await auth.login({
      identifier: loginForm.identifier,
      password: loginForm.password,
    })

    await navigateTo(redirectTo.value)
  } catch (error: unknown) {
    errorMessage.value = parseRequestError(error).message
  } finally {
    pending.value = false
  }
}

const submitRegister = async () => {
  pending.value = true
  errorMessage.value = ''
  registerErrors.value = {}

  try {
    await auth.register({
      name: registerForm.name,
      username: registerForm.username || undefined,
      email: registerForm.email || undefined,
      password: registerForm.password,
    })

    await navigateTo(redirectTo.value)
  } catch (error: unknown) {
    const { message, violations } = parseRequestError(error)
    const fieldErrors: RegisterErrors = {}
    let generalMessage = ''

    // Нарушения известных полей показываются у полей, остальные — общим сообщением.
    for (const { field, error: text } of violations) {
      const registerField = REGISTER_FIELDS.find((name) => name === field)

      if (registerField) {
        fieldErrors[registerField] ??= text
      } else {
        generalMessage ||= text
      }
    }

    registerErrors.value = fieldErrors
    errorMessage.value = generalMessage || (Object.keys(fieldErrors).length > 0 ? '' : message)
  } finally {
    pending.value = false
  }
}

const submitGuest = async () => {
  auth.loginAsGuest()
  await navigateTo(redirectTo.value)
}
</script>

<template>
  <div class="w-full">
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p class="mb-2 text-xs uppercase tracking-[0.18em] text-gray-500">Watched Account</p>
        <h1 class="mb-3 text-2xl font-bold text-gray-900">Авторизация</h1>
        <p class="text-sm text-gray-600">
          Войдите по credentials (имя, логин или email) и паролю, зарегистрируйте новый аккаунт,
          либо продолжите как гость.
        </p>

        <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 class="text-sm font-semibold text-slate-900">Вход как гость</h2>
          <p class="mt-1 text-sm text-slate-600">
            Гость может просматривать данные, но защищенные операции могут быть недоступны.
          </p>
          <button
            type="button"
            class="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            @click="submitGuest"
          >
            Продолжить как гость
          </button>
        </div>
      </section>

      <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            class="w-1/2 rounded-md px-3 py-2 text-sm font-medium transition"
            :class="
              mode === 'login'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            "
            @click="mode = 'login'"
          >
            Вход
          </button>
          <button
            type="button"
            class="w-1/2 rounded-md px-3 py-2 text-sm font-medium transition"
            :class="
              mode === 'register'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            "
            @click="mode = 'register'"
          >
            Регистрация
          </button>
        </div>

        <p
          v-if="noticeMessage"
          role="status"
          class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          {{ noticeMessage }}
        </p>

        <p
          v-if="errorMessage"
          class="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {{ errorMessage }}
        </p>

        <form v-if="mode === 'login'" class="space-y-4" @submit.prevent="submitLogin">
          <label class="block text-sm font-medium text-gray-700">
            Identifier (имя, логин или email)
            <input
              v-model="loginForm.identifier"
              type="text"
              required
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
              placeholder="Введите имя, логин или email"
            />
          </label>

          <label class="block text-sm font-medium text-gray-700">
            Пароль
            <input
              v-model="loginForm.password"
              type="password"
              required
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
              placeholder="Введите пароль"
            />
          </label>

          <button
            type="submit"
            :disabled="pending"
            class="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ pending ? 'Входим...' : 'Войти' }}
          </button>
        </form>

        <form v-else class="space-y-4" novalidate @submit.prevent="submitRegister">
          <p class="text-xs text-gray-500">Укажите логин, email или оба.</p>

          <label class="block text-sm font-medium text-gray-700">
            Имя
            <input
              v-model="registerForm.name"
              type="text"
              required
              :aria-invalid="Boolean(registerErrors.name)"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
              :class="registerErrors.name ? 'border-red-400' : 'border-gray-300'"
              placeholder="Ваше имя"
            />
            <span v-if="registerErrors.name" class="mt-1 block text-xs font-normal text-red-600">
              {{ registerErrors.name }}
            </span>
          </label>

          <label class="block text-sm font-medium text-gray-700">
            Логин
            <input
              v-model="registerForm.username"
              type="text"
              :aria-invalid="Boolean(registerErrors.username)"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
              :class="registerErrors.username ? 'border-red-400' : 'border-gray-300'"
              placeholder="username"
            />
            <span
              v-if="registerErrors.username"
              class="mt-1 block text-xs font-normal text-red-600"
            >
              {{ registerErrors.username }}
            </span>
          </label>

          <label class="block text-sm font-medium text-gray-700">
            Email
            <input
              v-model="registerForm.email"
              type="email"
              :aria-invalid="Boolean(registerErrors.email)"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
              :class="registerErrors.email ? 'border-red-400' : 'border-gray-300'"
              placeholder="you@example.com"
            />
            <span v-if="registerErrors.email" class="mt-1 block text-xs font-normal text-red-600">
              {{ registerErrors.email }}
            </span>
          </label>

          <label class="block text-sm font-medium text-gray-700">
            Пароль
            <input
              v-model="registerForm.password"
              type="password"
              required
              :aria-invalid="Boolean(registerErrors.password)"
              class="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-indigo-500"
              :class="registerErrors.password ? 'border-red-400' : 'border-gray-300'"
              placeholder="Минимум 6 символов"
            />
            <span
              v-if="registerErrors.password"
              class="mt-1 block text-xs font-normal text-red-600"
            >
              {{ registerErrors.password }}
            </span>
          </label>

          <button
            type="submit"
            :disabled="pending"
            class="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ pending ? 'Регистрируем...' : 'Зарегистрироваться' }}
          </button>
        </form>
      </section>
    </div>
  </div>
</template>
