<script setup>
import { ref } from 'vue';
import http from '@/api/http';
import { useToast } from '@/toast';
const toast = useToast();
const form = ref({ currentPassword: '', newPassword: '', confirm: '' });
const saving = ref(false);
async function save() {
  if (!form.value.currentPassword || !form.value.newPassword) { toast.warn('Fill in your current and new password.'); return; }
  if (form.value.newPassword.length < 4) { toast.warn('New password must be at least 4 characters.'); return; }
  if (form.value.newPassword !== form.value.confirm) { toast.warn('The new passwords do not match.'); return; }
  saving.value = true;
  try {
    await http.post('/auth/change-password', { currentPassword: form.value.currentPassword, newPassword: form.value.newPassword });
    toast.success('Password changed. Use your new password next time you log in.');
    form.value = { currentPassword: '', newPassword: '', confirm: '' };
  } catch (e) { toast.error(e?.response?.data?.message || 'Could not change password.'); }
  finally { saving.value = false; }
}
</script>
<template>
  <div class="mx-auto max-w-md text-[#241b33]">
    <h1 class="mb-4 text-2xl font-bold text-[#4c1d95]">Change Password</h1>
    <div class="space-y-3 rounded-2xl border border-[#e5e0f7] bg-white p-6">
      <input v-model="form.currentPassword" type="password" placeholder="Current password" class="w-full rounded-lg border border-slate-300 p-3 text-lg" />
      <input v-model="form.newPassword" type="password" placeholder="New password" class="w-full rounded-lg border border-slate-300 p-3 text-lg" />
      <input v-model="form.confirm" type="password" placeholder="Confirm new password" class="w-full rounded-lg border border-slate-300 p-3 text-lg" />
      <button class="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#6d28d9] text-lg font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Change password' }}</button>
    </div>
  </div>
</template>
