<script setup lang="ts">
const route = useRoute()
const auth = useAuth()

definePageMeta({
  layout: 'auth',
})

const mode = ref<'login' | 'register'>('login')

const redirectTo = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' && value.startsWith('/') ? value : '/'
})

const noticeMessage = computed(() =>
  route.query.reason === SESSION_EXPIRED_REASON ? SESSION_EXPIRED_MESSAGE : '',
)

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
          Войдите по логину или email и паролю, зарегистрируйте новый аккаунт, либо продолжите как
          гость.
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

        <KeepAlive>
          <AuthFormsLogin v-if="mode === 'login'" :redirect-to="redirectTo" />
          <AuthFormsRegister v-else :redirect-to="redirectTo" />
        </KeepAlive>
      </section>
    </div>
  </div>
</template>
