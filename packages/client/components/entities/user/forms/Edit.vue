<script setup lang="ts">
import type { UpdateUserDto } from '~/types/api'

const props = defineProps<{ identifier: string }>()

const emit = defineEmits<{
  'name-loaded': [name: string]
}>()

const auth = useAuth()
const { get, update } = useUsers()

const {
  data: target,
  pending,
  error,
} = useLazyAsyncData(`user-profile-edit-${props.identifier}`, () => get(props.identifier))

const errorStatus = computed(() => parseRequestError(error.value).statusCode)

type ProfileErrors = Partial<Record<'name' | 'username' | 'email', string>>

const USERNAME_PATTERN = /^[A-Za-z0-9_]{1,50}$/

const form = reactive({
  name: '',
  username: '',
  email: '',
})

const formLayout = [
  { columns: 1, fields: [{ id: 'name' }] },
  { columns: 2, fields: [{ id: 'username' }, { id: 'email' }] },
]

const fieldErrors = ref<ProfileErrors>({})
const emailValid = ref(true)
const errorMessage = ref('')
const lostResponse = ref(false)
const submitting = ref(false)

let active = true
onBeforeUnmount(() => {
  active = false
})

// Админ редактирует любой профиль, обычный пользователь — только свой, гость — ничей.
const canEdit = computed(() => {
  const viewer = auth.user.value

  if (!target.value || !viewer) return false
  if (viewer.role === 'ADMIN') return true
  if (viewer.role === 'GUEST') return false

  return viewer.id === target.value.id
})

watch(
  target,
  async (user) => {
    if (!user) return

    if (!canEdit.value) {
      await navigateTo(`/users/${user.id}`, { replace: true })
      return
    }

    emit('name-loaded', user.name)
    form.name = user.name
    form.username = user.username ?? ''
    form.email = user.email ?? ''
  },
  { immediate: true },
)

const submit = async () => {
  const user = target.value
  if (!user || submitting.value) return

  errorMessage.value = ''
  lostResponse.value = false

  const errors: ProfileErrors = {}
  const name = form.name.trim()
  const username = form.username.trim()
  const email = form.email.trim()

  if (!name) {
    errors.name = 'Имя обязательно'
  } else if ([...name].length > 255) {
    errors.name = 'Имя не длиннее 255 символов'
  }

  if (username && !USERNAME_PATTERN.test(username)) {
    errors.username = 'Логин: от 1 до 50 латинских букв, цифр или подчёркиваний'
  }

  if (!username && !email) {
    errors.username ??= 'Укажите логин или email'
    errors.email ??= 'Укажите логин или email'
  }

  fieldErrors.value = errors
  // Формат email проверяет поле ввода и показывает ошибку у себя.
  if (Object.keys(errors).length > 0 || !emailValid.value) return

  // В patch попадают только изменённые поля, сравнение — с исходным значением без нормализации.
  const patch: UpdateUserDto = {}
  if (name !== user.name) patch.name = name
  const nextUsername = username || null
  if (nextUsername !== user.username) patch.username = nextUsername
  const nextEmail = email || null
  if (nextEmail !== (user.email ?? null)) patch.email = nextEmail

  submitting.value = true
  try {
    const updated = await update(user.id, patch)

    if (auth.user.value?.id === user.id) {
      auth.user.value = updated
    }

    if (active) {
      // Профиль адресуется логином в каноническом формате, иначе — UUID.
      const profileIdentifier =
        updated.username && USERNAME_PATTERN.test(updated.username) ? updated.username : updated.id

      await navigateTo(`/users/${encodeURIComponent(profileIdentifier)}`)
    }
  } catch (e: unknown) {
    const { statusCode, message, violations } = parseRequestError(e)

    if (statusCode === 401) {
      // Сессию завершает глобальная обработка в useApiRequest.
    } else if (statusCode === 422) {
      fieldErrors.value = violations
      errorMessage.value = message
    } else if (statusCode === null) {
      lostResponse.value = true
    } else if (statusCode === 403) {
      errorMessage.value = 'Нет прав на изменение этого профиля.'
    } else if (statusCode === 404) {
      errorMessage.value = 'Пользователь не найден'
    } else {
      errorMessage.value = 'Не удалось сохранить профиль. Попробуйте позже.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="px-6 py-6" novalidate @submit.prevent="submit">
    <div v-if="pending" role="status" class="py-12 text-center text-gray-500">
      Загрузка профиля...
    </div>

    <div v-else-if="errorStatus === 404" class="py-12 text-center text-gray-500">
      Пользователь не найден
    </div>

    <div
      v-else-if="error"
      role="alert"
      class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {{
        errorStatus === 403
          ? 'Нет доступа к профилю пользователя.'
          : 'Не удалось загрузить профиль пользователя. Попробуйте позже.'
      }}
    </div>

    <div v-else-if="target && canEdit" class="space-y-6">
      <CommonFormsConfigurableFields :config="formLayout">
        <template #name>
          <EntitiesUserInputsName
            v-model="form.name"
            :error="fieldErrors.name"
            :disabled="submitting"
          />
        </template>

        <template #username>
          <EntitiesUserInputsUsername
            v-model="form.username"
            :error="fieldErrors.username"
            :disabled="submitting"
          />
        </template>

        <template #email>
          <EntitiesUserInputsEmail
            v-model="form.email"
            v-model:valid="emailValid"
            :error="fieldErrors.email"
            :disabled="submitting"
          />
        </template>
      </CommonFormsConfigurableFields>

      <div
        v-if="lostResponse"
        role="alert"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        Не удалось подтвердить сохранение. Проверьте профиль перед повторной отправкой.
        <NuxtLink :to="`/users/${target.id}`" class="font-medium underline">
          Открыть профиль
        </NuxtLink>
      </div>

      <div
        v-else-if="errorMessage"
        role="alert"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ errorMessage }}
      </div>

      <div class="flex items-center justify-end gap-3">
        <NuxtLink
          :to="`/users/${target.id}`"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Отмена
        </NuxtLink>
        <button
          type="submit"
          :disabled="submitting"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {{ submitting ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </form>
</template>
