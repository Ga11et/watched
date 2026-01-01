<template>
  <nav v-if="items?.length" class="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
    <ol class="flex flex-wrap items-center gap-2">
      <li v-for="(item, idx) in items" :key="idx" class="flex items-center gap-2">
        <template v-if="item.to && idx < items.length - 1">
          <NuxtLink :to="item.to" class="hover:text-gray-700">{{ item.label }}</NuxtLink>
          <span class="text-gray-400">/</span>
        </template>
        <template v-else>
          <span class="text-gray-700 font-medium">{{ item.label }}</span>
        </template>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
interface CrumbItem {
  label: string
  to?: string
}

defineProps<{ items: CrumbItem[] }>()
</script>
