<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const deferred = ref(null);
const canInstall = ref(false);
const installed = ref(false);
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

function onPrompt(e) { e.preventDefault(); deferred.value = e; canInstall.value = true; }
function onInstalled() { installed.value = true; canInstall.value = false; }

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onPrompt);
  window.addEventListener('appinstalled', onInstalled);
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) installed.value = true;
});
onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onPrompt);
  window.removeEventListener('appinstalled', onInstalled);
});

async function install() {
  if (!deferred.value) return;
  deferred.value.prompt();
  await deferred.value.userChoice;
  deferred.value = null; canInstall.value = false;
}
</script>

<template>
  <div>
    <button v-if="canInstall" @click="install"
      class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark">
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" /></svg>
      I-install ang app sa telepono
    </button>
    <p v-else-if="installed" class="text-sm font-semibold text-[#15803d]">Naka-install na ang app sa device na ito.</p>
    <p v-else-if="isIOS" class="text-sm text-slate-500">Para i-install sa iPhone: pindutin ang <b>Share</b>, tapos <b>Add to Home Screen</b>.</p>
  </div>
</template>
