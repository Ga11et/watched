<template>
  <div class="overflow-x-auto rounded-lg border border-gray-200 bg-white">
    <table class="min-w-full divide-y divide-gray-200 text-sm">
      <thead class="bg-gray-50">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :class="[
              'px-4 py-3 font-medium text-gray-700 transition-colors',
              column.sortable ? 'cursor-pointer hover:bg-gray-100' : '',
              column.align === 'right' ? 'text-right' : 'text-left',
            ]"
            @click="column.sortable ? handleSort(column.key) : null"
          >
            <div
              class="flex items-center gap-1"
              :class="{ 'justify-end': column.align === 'right' }"
            >
              {{ column.label }}
              <span
                v-if="column.sortable"
                class="inline-block w-4 h-4 flex items-center justify-start"
              >
                <span v-if="sortBy === column.key" class="text-gray-700">
                  <svg
                    v-if="sortOrder === 'ASC'"
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3L5 8H15L10 3Z" />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 17L5 12H15L10 17Z" />
                  </svg>
                </span>
                <span v-else class="text-gray-400">
                  <svg
                    class="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 3L5 8H15L10 3ZM10 17L15 12H5L10 17Z" />
                  </svg>
                </span>
              </span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50">
          <td
            v-for="column in columns"
            :key="column.key"
            :class="['px-4 py-3', column.align === 'right' ? 'text-right' : '']"
          >
            <slot :name="`cell-${column.key}`" :item="item">
              {{ item[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Column {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'right'
}

interface Props {
  columns: Column[]
  items: any[]
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-sorting': [sortBy: string]
}>()

const handleSort = (columnKey: string) => {
  emit('update-sorting', columnKey)
}
</script>
