<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title: string
    dismissible?: boolean
  }>(),
  { dismissible: true },
)

const dialogRef = ref<HTMLDialogElement | null>(null)
const titleId = useId()

watch([open, dialogRef], ([value, dialog]) => {
  if (!dialog) return

  if (value && !dialog.open) {
    dialog.showModal()
  } else if (!value && dialog.open) {
    dialog.close()
  }
})

const onCancel = (event: Event) => {
  event.preventDefault()
  if (props.dismissible) {
    open.value = false
  }
}

const onBackdropClick = (event: MouseEvent) => {
  if (event.target === dialogRef.value && props.dismissible) {
    open.value = false
  }
}

const onClose = () => {
  open.value = false
}
</script>

<template>
  <dialog
    ref="dialogRef"
    :aria-labelledby="titleId"
    class="m-auto w-full max-w-md rounded-xl bg-white p-0 shadow-xl backdrop:bg-black/40"
    @cancel="onCancel"
    @click="onBackdropClick"
    @close="onClose"
  >
    <div class="p-6">
      <h2 :id="titleId" class="text-lg font-semibold text-gray-900">
        {{ title }}
      </h2>
      <div class="mt-4">
        <slot />
      </div>
      <div class="mt-6 flex justify-end gap-3">
        <slot name="actions" />
      </div>
    </div>
  </dialog>
</template>
