<template>
  <div class="space-y-6">
    <template v-for="(row, rowIndex) in config" :key="`row-${rowIndex}`">
      <div v-if="hasAnyFieldSlot(row)" :class="getRowClass(row.columns)">
        <template
          v-for="(field, fieldIndex) in row.fields"
          :key="`field-${rowIndex}-${field.id}-${fieldIndex}`"
        >
          <div v-if="hasFieldSlot(field.id)">
            <slot :name="field.id" :field-id="field.id" :field="field" :row="row" />
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface OutputFieldConfig {
  id: string
}

interface OutputRowConfig {
  columns?: number
  fields: OutputFieldConfig[]
}

interface Props {
  config: OutputRowConfig[]
}

defineProps<Props>()
const slots = useSlots()

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

const hasFieldSlot = (fieldId: string) => {
  return Boolean(slots[fieldId])
}

const hasAnyFieldSlot = (row: OutputRowConfig) => {
  return row.fields.some((field) => hasFieldSlot(field.id))
}
</script>
