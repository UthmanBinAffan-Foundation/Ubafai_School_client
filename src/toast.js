import { ref } from 'vue';
const toasts = ref([]);
let seq = 0;
function show(message, type = 'info', ms = 3800) {
  const id = ++seq;
  toasts.value.push({ id, message, type });
  setTimeout(() => { toasts.value = toasts.value.filter((t) => t.id !== id); }, ms);
}
export function useToast() {
  return {
    toasts,
    info: (m, ms) => show(m, 'info', ms),
    success: (m, ms) => show(m, 'success', ms),
    error: (m, ms) => show(m, 'error', ms),
    warn: (m, ms) => show(m, 'warn', ms),
  };
}
