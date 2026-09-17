<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import http from '@/api/http';
import { useToast } from '@/toast';

const route = useRoute(); const router = useRouter(); const toast = useToast();
const form = ref({ surname: '', givenName: '', middleName: '', lrn: '', birthdate: '', gender: '' });
const loading = ref(true); const saving = ref(false); const error = ref('');
const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

onMounted(async () => {
  try {
    const kids = (await http.get('/students/mine')).data;
    const child = kids.find((c) => c.student._id === route.params.id);
    if (!child) { error.value = 'Child not found for the current school year.'; return; }
    const s = child.student;
    form.value = { surname: s.surname || '', givenName: s.givenName || '', middleName: s.middleName || '', lrn: s.lrn || '', birthdate: toInput(s.birthdate), gender: s.gender || '' };
  } catch { error.value = 'Could not load student info.'; }
  finally { loading.value = false; }
});

async function save() {
  if (!form.value.surname || !form.value.givenName) { toast.warn('Surname and first name are required.'); return; }
  saving.value = true;
  try {
    await http.patch(`/students/${route.params.id}/info`, form.value);
    toast.success('Student info updated.');
    router.push('/portal');
  } catch (e) { toast.error(e?.response?.data?.message || 'Could not save.'); }
  finally { saving.value = false; }
}
</script>

<template>
  <div class="mx-auto max-w-lg text-[#241b33]">
    <router-link to="/portal" class="mb-3 inline-block text-[#4c1d95] underline">&larr; Back</router-link>
    <h1 class="mb-4 text-2xl font-bold text-[#4c1d95]">Update Student Info</h1>
    <p v-if="loading" class="text-slate-500">Loading…</p>
    <p v-if="error" class="rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>

    <div v-if="!loading && !error" class="space-y-3 rounded-2xl border border-[#e5e0f7] bg-white p-6">
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="text-sm text-slate-500">Surname<input v-model="form.surname" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-base" /></label>
        <label class="text-sm text-slate-500">First name<input v-model="form.givenName" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-base" /></label>
        <label class="text-sm text-slate-500">Middle name<input v-model="form.middleName" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-base" /></label>
        <label class="text-sm text-slate-500">LRN<input v-model="form.lrn" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-base tabular-nums" /></label>
        <label class="text-sm text-slate-500">Birthdate<input v-model="form.birthdate" type="date" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-base" /></label>
        <label class="text-sm text-slate-500">Gender
          <select v-model="form.gender" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-base"><option value="">—</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select>
        </label>
      </div>
      <button class="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#6d28d9] text-lg font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save changes' }}</button>
    </div>
  </div>
</template>
