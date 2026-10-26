<script setup lang="ts">
const props = defineProps<{ redirectTo: string }>()

const auth = useAuth()

type RegisterErrors = Partial<Record<'name' | 'username' | 'email' | 'password', string>>

const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
})

const pending = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<RegisterErrors>({})

const resetErrors = () => {
  errorMessage.value = ''
  fieldErrors.value = {}
}

onDeactivated(resetErrors)

const submit = async () => {
  pending.value = true
  resetErrors()

  try {
    await auth.register({
      name: form.name,
      username: form.username || undefined,
      email: form.email || undefined,
      password: form.password,
    })

    await navigateTo(props.redirectTo)
  } catch (error: unknown) {
    const { message, violations } = parseRequestError(error)
    fieldErrors.value = violations
    errorMessage.value = message
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form class="space-y-4" novalidate @submit.prevent="submit">
    <p
      v-if="errorMessage"
      role="alert"
      class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ errorMessage }}
    </p>

    <p class="text-xs text-gray-500">Укажите логин, email или оба.</p>

    <CommonInputsTextInput
      id="register-name"
      v-model="form.name"
      label="Имя"
      placeholder="Ваше имя"
      :error="fieldErrors.name"
    />

    <CommonInputsTextInput
      id="register-username"
      v-model="form.username"
      label="Логин"
      placeholder="username"
      :error="fieldErrors.username"
    />

    <CommonInputsEmailInput
      id="register-email"
      v-model="form.email"
      label="Email"
      placeholder="you@example.com"
      :error="fieldErrors.email"
    />

    <CommonInputsPasswordInput
      id="register-password"
      v-model="form.password"
      autocomplete="new-password"
      label="Пароль"
      placeholder="Минимум 6 символов"
      :error="fieldErrors.password"
    />

    <button
      type="submit"
      :disabled="pending"
      class="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {{ pending ? 'Регистрируем...' : 'Зарегистрироваться' }}
    </button>
  </form>
</template>
