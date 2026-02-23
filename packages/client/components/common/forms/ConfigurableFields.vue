<template>
  <div class="space-y-6">
    <div
      v-for="(row, rowIndex) in config"
      :key="`row-${rowIndex}`"
      :class="getRowClass(row.columns)"
    >
      <div
        v-for="(field, fieldIndex) in row.fields"
        :key="`field-${rowIndex}-${field.id}-${fieldIndex}`"
      >
        <slot :name="field.id" :field-id="field.id" :field="field" :row="row" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface FormFieldConfig {
  id: string
}

interface FormRowConfig {
  columns?: number
  fields: FormFieldConfig[]
}

interface Props {
  config: FormRowConfig[]
}

defineProps<Props>()

const rowClasses = {
  1: 'grid grid-cols-1 gap-6',
  2: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
} as const

const getRowClass = (columns?: number) => {
  const normalized = columns === 2 || columns === 3 || columns === 4 ? columns : 1
  return rowClasses[normalized]
}
</script>
