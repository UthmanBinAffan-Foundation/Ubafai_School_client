<script setup>
import { ref, computed, onMounted } from 'vue';
import http from '@/api/http';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useToast } from '@/toast';

const guardians = ref([]); const loading = ref(false); const error = ref('');
const search = ref('');
const auth = useAuthStore(); const router = useRouter(); const toast = useToast();
const isSuper = computed(() => auth.role === 'SUPERADMIN');
async function viewAs(g) { try { await auth.impersonate('guardian', g._id); router.push('/portal'); } catch { toast.error('Could not open account.'); } }
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  const list = q ? guardians.value.filter((g) => (g.name || '').toLowerCase().includes(q) || (g.mobile || '').includes(q)) : guardians.value;
  return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' }));
});
const creds = ref(null); const busyId = ref('');

async function load() {
  loading.value = true; error.value = '';
  try { guardians.value = (await http.get('/guardians')).data; }
  catch { error.value = 'Could not load the list.'; }
  finally { loading.value = false; }
}
onMounted(load);

async function reset(g) {
  busyId.value = g._id; creds.value = null;
  try { creds.value = { name: g.name, ...(await http.post(`/guardians/${g._id}/reset-password`)).data.credentials }; }
  catch { error.value = 'Could not reset.'; }
  finally { busyId.value = ''; }
}
async function toggle(g) {
  busyId.value = g._id;
  try { g.active = (await http.post(`/guardians/${g._id}/toggle-active`)).data.active; }
  catch { error.value = 'Could not change.'; }
  finally { busyId.value = ''; }
}
</script>

<template>
  <div class="text-[#241b33]">
    <p class="mb-4 text-lg text-slate-600">Manage parent logins.</p>
    <input v-model="search" placeholder="Search by name or mobile…" class="mb-4 w-full max-w-md rounded-xl border border-slate-300 p-3 text-lg" />

    <div v-if="creds" class="mb-4 rounded-xl border-2 border-[#4c1d95] bg-white px-5 py-4">
      <p class="font-bold text-[#4c1d95]">New password for {{ creds.name }} (shown only once):</p>
      <p class="mt-2 text-xl tabular-nums">Username: <b>{{ creds.username }}</b></p>
      <p class="text-xl tabular-nums">Password: <b>{{ creds.password }}</b></p>
      <button class="mt-2 text-base text-slate-500 underline" @click="creds = null">Close</button>
    </div>
    <p v-if="error" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-4 text-lg font-semibold text-[#b91c1c]">{{ error }}</p>
    <p v-if="loading" class="py-10 text-center text-xl text-slate-600">Loading&hellip;</p>

    <p v-else-if="!guardians.length" class="text-lg text-slate-600">No parents yet. Create parents in Enroll.</p>
    <p v-if="guardians.length && !filtered.length" class="text-lg text-slate-500">No parents match your search.</p>
    <ul v-else class="space-y-3">
      <li v-for="g in filtered" :key="g._id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e0f7] bg-white p-4">
        <div>
          <p class="text-lg font-bold">{{ g.name }}
            <span class="ml-2 rounded px-2 py-0.5 text-sm font-semibold" :class="g.active ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#b91c1c]'">{{ g.active ? 'Active' : 'Disabled' }}</span>
          </p>
          <p class="text-slate-600">{{ g.mobile || '\u2014' }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button v-if="isSuper" class="rounded-lg border-2 border-[#0f5132] px-3 py-2 font-semibold text-[#0f5132] hover:bg-[#ecfdf5]" @click="viewAs(g)">View as</button>
          <button class="rounded-lg border-2 border-[#4c1d95] px-3 py-2 font-semibold text-[#4c1d95] hover:bg-[#f5f3ff] disabled:opacity-50" :disabled="busyId === g._id" @click="reset(g)">Reset password</button>
          <button class="rounded-lg border-2 px-3 py-2 font-semibold disabled:opacity-50" :class="g.active ? 'border-[#b91c1c] text-[#b91c1c]' : 'border-[#15803d] text-[#15803d]'" :disabled="busyId === g._id" @click="toggle(g)">{{ g.active ? 'Deactivate' : 'Activate' }}</button>
        </div>
      </li>
    </ul>
  </div>
</template>
