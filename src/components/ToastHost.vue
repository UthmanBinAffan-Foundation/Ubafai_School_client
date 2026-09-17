<script setup>
import { useToast } from '@/toast';
const { toasts } = useToast();
const cls = (t) => ({ success: 'bg-[#15803d]', error: 'bg-[#b91c1c]', warn: 'bg-[#b45309]', info: 'bg-[#4c1d95]' }[t] || 'bg-[#4c1d95]');
</script>
<template>
  <div class="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
    <transition-group name="toast">
      <div v-for="t in toasts" :key="t.id" class="pointer-events-auto max-w-md rounded-xl px-5 py-3 text-center text-base font-semibold text-white shadow-lg" :class="cls(t.type)">{{ t.message }}</div>
    </transition-group>
  </div>
</template>
<style scoped>
.toast-enter-active, .toast-leave-active { transition: all .25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
