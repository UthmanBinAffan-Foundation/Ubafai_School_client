<script setup>
import { ref, onMounted } from 'vue';
import http from '@/api/http';
import { useToast } from '@/toast';
const toast = useToast();
const rows = ref([]); const loading = ref(false);
const form = ref({ username: '', password: '' }); const creating = ref(false);
async function load() { loading.value = true; try { rows.value = (await http.get('/admins')).data; } catch { toast.error('Could not load admins.'); } finally { loading.value = false; } }
onMounted(load);
async function createAdmin() {
  if (!form.value.username || !form.value.password) { toast.warn('Enter a username and password.'); return; }
  creating.value = true;
  try { await http.post('/admins', form.value); toast.success(`Admin "${form.value.username.toLowerCase()}" created.`); form.value = { username: '', password: '' }; await load(); }
  catch (e) { toast.error(e?.response?.data?.message || 'Could not create admin.'); }
  finally { creating.value = false; }
}
async function resetPw(a) {
  const pw = prompt(`New password for "${a.username}" (at least 4 characters):`);
  if (!pw) return;
  try { await http.post(`/admins/${a._id}/reset-password`, { password: pw }); toast.success(`Password reset for "${a.username}".`); }
  catch (e) { toast.error(e?.response?.data?.message || 'Could not reset password.'); }
}
async function toggleActive(a) {
  try { const { data } = await http.post(`/admins/${a._id}/toggle-active`); a.isActive = data.isActive; }
  catch { toast.error('Could not update status.'); }
}
</script>
<template>
  <div class="text-[#241b33]">
    <p class="mb-4 text-lg text-slate-600">Create admin accounts and reset their passwords.</p>
    <section class="mb-6 rounded-2xl border border-[#e5e0f7] bg-white p-5">
      <h2 class="mb-2 text-xl font-bold text-[#5b21b6]">New Admin</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <input v-model="form.username" placeholder="Username" class="rounded-lg border border-slate-300 p-3 lowercase" />
        <input v-model="form.password" type="text" placeholder="Password" class="rounded-lg border border-slate-300 p-3" />
      </div>
      <button class="mt-3 rounded-xl bg-[#6d28d9] px-5 py-2.5 font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="creating" @click="createAdmin">{{ creating ? 'Creating…' : 'Create admin' }}</button>
    </section>
    <p v-if="loading" class="text-slate-500">Loading…</p>
    <ul v-else class="space-y-3">
      <li v-for="a in rows" :key="a._id" class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5e0f7] bg-white p-4">
        <div>
          <span class="text-lg font-bold text-[#4c1d95]">{{ a.username }}</span>
          <span class="ml-2 rounded px-2 py-0.5 text-sm font-semibold" :class="a.isActive ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-slate-200 text-slate-600'">{{ a.isActive ? 'Active' : 'Inactive' }}</span>
        </div>
        <div class="flex gap-2">
          <button class="rounded-lg border border-slate-400 px-3 py-1.5 text-sm font-semibold text-slate-700" @click="resetPw(a)">Reset password</button>
          <button class="rounded-lg border px-3 py-1.5 text-sm font-semibold" :class="a.isActive ? 'border-[#b91c1c] text-[#b91c1c]' : 'border-[#15803d] text-[#15803d]'" @click="toggleActive(a)">{{ a.isActive ? 'Deactivate' : 'Activate' }}</button>
        </div>
      </li>
      <li v-if="!rows.length" class="text-slate-500">No other admin accounts.</li>
    </ul>
  </div>
</template>
