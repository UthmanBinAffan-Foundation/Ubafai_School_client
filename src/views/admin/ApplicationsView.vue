<script setup>
import { ref, onMounted, watch } from 'vue';
import http from '@/api/http';
import { useSchoolYearStore } from '@/stores/schoolYear';
const sy = useSchoolYearStore();

const apps = ref([]); const loading = ref(false); const error = ref(''); const msg = ref(''); const busyId = ref('');
const fileBase = (import.meta.env.VITE_API_BASE || '').replace(/\/api\/?$/, '');
const GRADE_LABEL = { NURSERY: 'Nursery', KINDER_1: 'Kinder 1', KINDER_2: 'Kinder 2', GRADE_1: 'Grade 1', GRADE_2: 'Grade 2', GRADE_3: 'Grade 3', GRADE_4: 'Grade 4', GRADE_5: 'Grade 5', GRADE_6: 'Grade 6' };
const gLabel = (g) => GRADE_LABEL[g] || g;
const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;

async function load() {
  loading.value = true; error.value = '';
  try { apps.value = (await http.get('/applications' + (sy.selected ? `?schoolYear=${sy.selected}` : ''))).data; }
  catch { error.value = 'Could not load applications.'; }
  finally { loading.value = false; }
}
onMounted(load);
watch(() => sy.selected, load);

async function approve(a) {
  if (a.status !== 'PENDING_APPROVAL') { error.value = 'Waiting for the application fee first.'; return; }
  busyId.value = a._id; msg.value = ''; error.value = '';
  try {
    const { data } = await http.post(`/applications/${a._id}/approve`);
    apps.value = apps.value.filter((x) => x._id !== a._id);
    msg.value = data.alreadyHadAccount
      ? `Approved. ${a.student.givenName} is now linked to the parent's existing account.`
      : `Approved. The parent can now log in with the username they chose.`;
  } catch (e) { error.value = e?.response?.data?.message || 'Could not approve.'; }
  finally { busyId.value = ''; }
}
async function reject(a) {
  busyId.value = a._id;
  try { await http.post(`/applications/${a._id}/reject`, { reason: 'Rejected by admin' }); apps.value = apps.value.filter((x) => x._id !== a._id); }
  catch { error.value = 'Could not reject.'; } finally { busyId.value = ''; }
}
</script>

<template>
  <div class="text-[#241b33]">
    <div class="mb-4 flex items-center justify-between gap-3">
      <p class="text-lg text-slate-600">Applications submitted by parents. Approve once the application fee is paid.</p>
      <router-link to="/admin/enroll" class="shrink-0 rounded-lg border-2 border-[#4c1d95] px-3 py-2 text-sm font-semibold text-[#4c1d95] hover:bg-[#f5f3ff]">Enroll manually</router-link>
    </div>

    <p v-if="msg" class="mb-4 rounded-xl bg-[#dcfce7] px-5 py-3 font-semibold text-[#15803d]">{{ msg }}</p>
    <p v-if="error" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>
    <p v-if="loading" class="py-10 text-center text-xl text-slate-600">Loading…</p>

    <p v-else-if="!apps.length" class="rounded-2xl border-2 border-dashed border-[#c4b5fd] bg-white py-16 text-center text-xl font-bold text-[#5b21b6]">No pending applications.</p>
    <ul v-else class="space-y-4">
      <li v-for="a in apps" :key="a._id" class="rounded-2xl border border-[#e5e0f7] bg-white p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-xl font-bold">{{ a.student.surname }}, {{ a.student.givenName }} {{ a.student.middleName }}
              <span class="ml-2 rounded px-2 py-0.5 text-sm font-semibold" :class="a.returning ? 'bg-[#dbeafe] text-[#1e40af]' : 'bg-[#dcfce7] text-[#15803d]'">{{ a.returning ? 'Returning student' : 'New student' }}</span>
            </p>
            <p class="text-slate-600">Applying for: {{ gLabel(a.student.gradeLevel) }} · LRN: {{ a.student.lrn || '—' }}</p>
            <p v-if="a.returning && a.previous" class="text-sm text-slate-500">Previous record: {{ gLabel(a.previous.gradeLevel) }}<span v-if="a.previous.schoolYear"> ({{ a.previous.schoolYear }})</span></p>
            <p class="mt-1 text-slate-600">Parent: {{ a.guardian.name }} · {{ a.guardian.mobile || '—' }}</p>
          </div>
          <span class="rounded px-2 py-1 text-sm font-semibold" :class="a.status === 'PENDING_APPROVAL' ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef3c7] text-[#b45309]'">{{ a.status === 'PENDING_APPROVAL' ? 'Fee paid — ready' : 'Waiting for fee' }}</span>
        </div>

        <div class="mt-3 rounded-xl bg-[#f5f3ff] p-4">
          <p class="font-semibold text-[#4c1d95]">Application fee: {{ peso(a.applicationFee) }}</p>
          <p v-if="a.feePayment && a.feePayment.referenceNo" class="mt-1">Paid via <b>{{ a.feePayment.method }}</b> · Ref: <b class="tabular-nums">{{ a.feePayment.referenceNo }}</b></p>
          <a v-if="a.feePayment && a.feePayment.proofImageUrl" :href="fileBase + a.feePayment.proofImageUrl" target="_blank" class="text-[#4c1d95] underline">View proof</a>
          <p v-if="!a.feePayment || !a.feePayment.referenceNo" class="text-slate-500">No fee payment submitted yet.</p>
        </div>

        <div class="mt-4 flex flex-col gap-3 sm:flex-row">
          <button class="inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-[#15803d] px-6 text-lg font-bold text-white hover:bg-[#116932] disabled:opacity-60" :disabled="busyId === a._id || a.status !== 'PENDING_APPROVAL'" @click="approve(a)">Approve &amp; create record</button>
          <button class="inline-flex min-h-[52px] items-center justify-center rounded-xl border-2 border-[#b91c1c] px-6 text-lg font-bold text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white disabled:opacity-60" :disabled="busyId === a._id" @click="reject(a)">Reject</button>
        </div>
      </li>
    </ul>
  </div>
</template>
