<script setup lang="ts">
import { ref, watch } from 'vue'
import { parseKeywords } from '@/schemas/analysisRuleSchema'

const props = withDefaults(
  defineProps<{
    modelValue?: unknown
    placeholder?: string
    invalid?: boolean
  }>(),
  {
    modelValue: () => [],
    placeholder: 'Введите слово и нажмите Enter',
    invalid: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

function keywordsEqual(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index])
}

const draft = ref('')
const chips = ref<string[]>(parseKeywords(props.modelValue))

watch(
  () => props.modelValue,
  (value) => {
    const parsed = parseKeywords(value)

    if (!keywordsEqual(parsed, chips.value)) {
      chips.value = parsed
    }
  },
)

function emitChips(next: string[]): void {
  chips.value = next
  emit('update:modelValue', next)
}

function commitDraft(): void {
  const keyword = draft.value.trim().replace(/,+$/, '')

  if (keyword === '' || chips.value.includes(keyword)) {
    draft.value = ''
    return
  }

  emitChips([...chips.value, keyword])
  draft.value = ''
}

function removeChip(index: number): void {
  emitChips(chips.value.filter((_, chipIndex) => chipIndex !== index))
}

function onInputKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    commitDraft()
    return
  }

  if (event.key === 'Backspace' && draft.value === '' && chips.value.length > 0) {
    event.preventDefault()
    removeChip(chips.value.length - 1)
  }
}
</script>

<template>
  <div
    class="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm"
    :class="invalid ? 'border-red-300 bg-red-50/40' : 'border-slate-300 bg-white'"
    @click="($event.currentTarget as HTMLElement).querySelector('input')?.focus()"
  >
    <span
      v-for="(chip, index) in chips"
      :key="`${chip}-${index}`"
      class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
    >
      {{ chip }}
      <button
        type="button"
        class="rounded-full px-1 text-blue-500 transition hover:bg-blue-100 hover:text-blue-800"
        :aria-label="`Удалить ${chip}`"
        @click.stop="removeChip(index)"
      >
        ×
      </button>
    </span>

    <input
      v-model="draft"
      type="text"
      class="min-w-[160px] flex-1 border-0 bg-transparent p-0 text-sm outline-none"
      :placeholder="chips.length === 0 ? placeholder : 'Добавить ещё'"
      @keydown="onInputKeydown"
      @blur="commitDraft"
    >
  </div>
</template>
