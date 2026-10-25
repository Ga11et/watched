<script setup lang="ts">
definePageMeta({
  middleware: (to) => {
    const { user } = useAuth()

    return navigateTo(user.value ? `/users/${user.value.id}` : loginRoute(to.fullPath))
  },
})
</script>

<template>
  <div />
</template>
