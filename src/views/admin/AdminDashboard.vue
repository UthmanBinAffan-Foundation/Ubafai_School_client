<script setup>
import { ref, onMounted } from 'vue';
import http from '@/api/http';
import { enablePush, isPushSubscribed } from '@/push';

const pendingPayments = ref(0);
const pendingApps = ref(0);
const pushMsg = ref(''); const pushErr = ref(''); const notifOn = ref(false);

onMounted(async () => {
  try { pendingPayments.value = (await http.get('/payments/pending')).data.length; } catch { /* ok */ }
  try { pendingApps.value = (await http.get('/applications')).data.length; } catch { /* ok */ }
  notifOn.value = await isPushSubscribed();
});

async function turnOnNotifs() {
  pushMsg.value = ''; pushErr.value = '';
  try { await enablePush(); notifOn.value = true; }
  catch (e) { pushErr.value = e?.message || 'Could not turn on notifications.'; }
}
</script>

<template>
  <div class="text-[#241b33]">
    <h1 class="mb-4 text-2xl font-bold text-[#4c1d95]">Welcome, Admin</h1>

    <!-- Notifications -->
    <div class="mb-5 rounded-2xl border border-[#e5e0f7] bg-white p-4">
      <div v-if="notifOn" class="flex items-center gap-2 font-semibold text-[#15803d]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path d="M20 6 9 17l-5-5" /></svg>
        Notifications are on for this device.
      </div>
      <template v-else>
        <button class="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#4c1d95] px-5 text-lg font-semibold text-white hover:bg-[#3b1580]" @click="turnOnNotifs">Turn on notifications</button>
        <p class="mt-2 text-sm text-slate-500">Get alerts for new online payments and enrollment applications.</p>
        <p v-if="pushErr" class="mt-1 text-sm font-semibold text-[#b91c1c]">{{ pushErr }}</p>
      </template>
    </div>

    <!-- To-do -->
    <router-link to="/admin/verify" class="mb-3 block rounded-2xl border border-[#e5e0f7] bg-white p-5">
      <span class="text-3xl font-bold" :class="pendingPayments ? 'text-[#b45309]' : 'text-[#15803d]'">{{ pendingPayments }}</span>
      <span class="text-lg"> payment(s) awaiting verification</span>
    </router-link>
    <router-link to="/admin/applications" class="mb-3 block rounded-2xl border border-[#e5e0f7] bg-white p-5">
      <span class="text-3xl font-bold" :class="pendingApps ? 'text-[#b45309]' : 'text-[#15803d]'">{{ pendingApps }}</span>
      <span class="text-lg"> enrollment application(s) to review</span>
    </router-link>
    <router-link to="/admin/masterlist" class="block rounded-2xl border border-[#e5e0f7] bg-white p-5 text-lg font-semibold text-[#4c1d95]">
      View the Digital Masterlist
    </router-link>
  </div>
</template>
