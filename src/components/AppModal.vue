<script setup>
defineProps({ show: Boolean, title: String });
const emit = defineEmits(['close']);
</script>

<template>
  <transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" @click.self="emit('close')">
      <div class="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 class="text-lg font-bold text-[#5b21b6]">{{ title }}</h3>
          <button class="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close" @click="emit('close')">
            <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div class="overflow-y-auto px-5 py-4"><slot /></div>
        <div v-if="$slots.footer" class="border-t border-slate-100 px-5 py-3 text-right"><slot name="footer" /></div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
