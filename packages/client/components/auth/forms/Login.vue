<script setup lang="ts">
const props = defineProps<{ redirectTo: string }>()

const auth = useAuth()

type LoginErrors = Partial<Record<'identifier' | 'password', string>>

const form = reactive({
  identifier: '',
  password: '',
})

const pending = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<LoginErrors>({})

const resetErrors = () => {
  errorMessage.value = ''
  fieldErrors.value = {}
}

onDeactivated(resetErrors)

const submit = async () => {
  pending.value = true
  resetErrors()

  try {
    await auth.login({
      identifier: form.identifier,
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
  <form class="space-y-4" @submit.prevent="submit">
    <p
      v-if="errorMessage"
      role="alert"
      class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{ errorMessage }}
    </p>

    <CommonInputsTextInput
      id="login-identifier"
      v-model="form.identifier"
      label="Логин или email"
      placeholder="Введите логин или email"
      :error="fieldErrors.identifier"
    />

    <CommonInputsPasswordInput
      id="login-password"
      v-model="form.password"
      autocomplete="current-password"
      label="Пароль"
      placeholder="Введите пароль"
      :error="fieldErrors.password"
    />

    <button
      type="submit"
      :disabled="pending"
      class="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {{ pending ? 'Входим...' : 'Войти' }}
    </button>
  </form>
</template>
