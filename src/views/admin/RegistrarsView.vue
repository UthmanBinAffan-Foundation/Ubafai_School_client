<script setup>
import { ref, onMounted } from 'vue';
import http from '@/api/http';
import { GRANTABLE_PAGES } from '@/permissions';

const rows = ref([]);
const loading = ref(false); const error = ref(''); const msg = ref('');
const form = ref({ username: '', password: '' });
const creating = ref(false);
const editPerms = ref({});

async function load() {
  loading.value = true; error.value = '';
  try {
    rows.value = (await http.get('/registrars')).data;
    editPerms.value = {};
    rows.value.forEach((r) => { editPerms.value[r._id] = [...(r.permissions || [])]; });
  } catch { error.value = 'Could not load registrars.'; }
  finally { loading.value = false; }
}
onMounted(load);

async function createRegistrar() {
  error.value = ''; msg.value = '';
  if (!form.value.username || !form.value.password) { error.value = 'Enter a username and password.'; return; }
  creating.value = true;
  try {
    await http.post('/registrars', { username: form.value.username, password: form.value.password });
    msg.value = `Registrar "${form.value.username.toLowerCase()}" created with the default pages enabled.`;
    form.value = { username: '', password: '' };
    await load();
  } catch (e) { error.value = e?.response?.data?.message || 'Could not create registrar.'; }
  finally { creating.value = false; }
}

const has = (id, key) => (editPerms.value[id] || []).includes(key);
function toggle(id, key) {
  const arr = [...(editPerms.value[id] || [])];
  const i = arr.indexOf(key);
  if (i >= 0) arr.splice(i, 1); else arr.push(key);
  editPerms.value[id] = arr;
}
async function savePerms(r) {
  error.value = ''; msg.value = '';
  try {
    const { data } = await http.patch(`/registrars/${r._id}/permissions`, { permissions: editPerms.value[r._id] || [] });
    r.permissions = data.permissions;
    msg.value = `Access updated for "${r.username}". They must log out and back in for changes to take effect.`;
  } catch (e) { error.value = e?.response?.data?.message || 'Could not save access.'; }
}
async function resetPw(r) {
  const pw = prompt(`New password for "${r.username}" (at least 4 characters):`);
  if (!pw) return;
  error.value = ''; msg.value = '';
  try { await http.post(`/registrars/${r._id}/reset-password`, { password: pw }); msg.value = `Password reset for "${r.username}".`; }
  catch (e) { error.value = e?.response?.data?.message || 'Could not reset password.'; }
}
async function toggleActive(r) {
  try { const { data } = await http.post(`/registrars/${r._id}/toggle-active`); r.isActive = data.isActive; }
  catch { error.value = 'Could not update status.'; }
}
</script>

<template>
  <div class="text-[#241b33]">
    <p class="mb-4 text-lg text-slate-600">Create registrar accounts and choose which pages each one can use.</p>
    <p v-if="msg" class="mb-3 rounded-xl bg-[#dcfce7] px-5 py-3 font-semibold text-[#15803d]">{{ msg }}</p>
    <p v-if="error" class="mb-3 rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>

    <!-- Create -->
    <section class="mb-6 rounded-2xl border border-[#e5e0f7] bg-white p-5">
      <h2 class="mb-2 text-xl font-bold text-[#5b21b6]">New Registrar</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <input v-model="form.username" placeholder="Username" class="rounded-lg border border-slate-300 p-3 lowercase" />
        <input v-model="form.password" type="text" placeholder="Password" class="rounded-lg border border-slate-300 p-3" />
      </div>
      <p class="mt-2 text-sm text-slate-500">By default, only Record Cash Payment, Enrollment Application, Masterlist, and Fees are enabled. You can change access below.</p>
      <button class="mt-3 rounded-xl bg-[#6d28d9] px-5 py-2.5 font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="creating" @click="createRegistrar">{{ creating ? 'Creating…' : 'Create registrar' }}</button>
    </section>

    <!-- List -->
    <p v-if="loading" class="text-slate-500">Loading…</p>
    <div v-else class="space-y-4">
      <section v-for="r in rows" :key="r._id" class="rounded-2xl border border-[#e5e0f7] bg-white p-5">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span class="text-lg font-bold text-[#4c1d95]">{{ r.username }}</span>
            <span class="ml-2 rounded px-2 py-0.5 text-sm font-semibold" :class="r.isActive ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-slate-200 text-slate-600'">{{ r.isActive ? 'Active' : 'Inactive' }}</span>
          </div>
          <div class="flex gap-2">
            <button class="rounded-lg border border-slate-400 px-3 py-1.5 text-sm font-semibold text-slate-700" @click="resetPw(r)">Reset password</button>
            <button class="rounded-lg border px-3 py-1.5 text-sm font-semibold" :class="r.isActive ? 'border-[#b91c1c] text-[#b91c1c]' : 'border-[#15803d] text-[#15803d]'" @click="toggleActive(r)">{{ r.isActive ? 'Deactivate' : 'Activate' }}</button>
          </div>
        </div>
        <p class="mb-2 font-semibold text-slate-700">Page access:</p>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label v-for="pg in GRANTABLE_PAGES" :key="pg.key" class="flex items-center gap-2 rounded-lg border border-[#eef0f6] p-2">
            <input type="checkbox" class="h-5 w-5" :checked="has(r._id, pg.key)" @change="toggle(r._id, pg.key)" />
            <span>{{ pg.label }}</span>
          </label>
        </div>
        <button class="mt-3 rounded-xl bg-[#6d28d9] px-5 py-2 font-bold text-white hover:bg-[#5b21b6]" @click="savePerms(r)">Save access</button>
      </section>
      <p v-if="!rows.length" class="text-slate-500">No registrar accounts yet.</p>
    </div>
  </div>
</template>
