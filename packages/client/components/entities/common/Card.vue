<template>
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="flex">
      <slot name="image" />
      <div class="p-4 flex-1">
        <div class="flex justify-between items-start">
          <slot name="title" />
          <slot name="actions" />
        </div>
        <slot name="content" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>
