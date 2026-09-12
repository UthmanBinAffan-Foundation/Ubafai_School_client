import { ref } from 'vue';

export const installPrompt = ref(null);
export const isInstalled = ref(
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true),
);

// Tinatawag sa main.js — bago pa mag-mount ang anumang component, para 'di ma-miss ang event
export function initPwaInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt.value = e; // itago para magamit ng button mamaya
  });
  window.addEventListener('appinstalled', () => {
    installPrompt.value = null;
    isInstalled.value = true;
  });
}

export async function promptInstall() {
  const e = installPrompt.value;
  if (!e) return 'unavailable';
  e.prompt();
  const { outcome } = await e.userChoice; // 'accepted' | 'dismissed'
  installPrompt.value = null;
  return outcome;
}
