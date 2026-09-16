<script setup>
import { ref, computed, onMounted } from 'vue';
import http from '@/api/http';

const GRADE_LABEL = { NURSERY: 'Nursery', KINDER_1: 'Kinder 1', KINDER_2: 'Kinder 2', GRADE_1: 'Grade 1', GRADE_2: 'Grade 2', GRADE_3: 'Grade 3', GRADE_4: 'Grade 4', GRADE_5: 'Grade 5', GRADE_6: 'Grade 6' };
const gLabel = (g) => GRADE_LABEL[g] || g;
const peso = (n) => `₱${Number(n || 0).toLocaleString('en-PH')}`;

const info = ref({ grades: [], applicationFeeByGrade: {}, payoutAccounts: [], children: [] });
const mode = ref('returning');
const sourceStudentId = ref('');
const newStudent = ref({ surname: '', givenName: '', middleName: '', lrn: '', birthdate: '', gender: '' });
const gradeLevel = ref('');
const step = ref(1);
const appId = ref(''); const appFee = ref(0);
const feeForm = ref({ method: 'GCASH', referenceNo: '' });
const proofFile = ref(null);
const busy = ref(false); const error = ref('');

onMounted(async () => {
  try {
    info.value = (await http.get('/apply/parent/info')).data;
    if (!info.value.children.length) mode.value = 'new';
    if (info.value.payoutAccounts.length) feeForm.value.method = info.value.payoutAccounts[0].method;
  } catch { error.value = 'Could not load data. Please try again.'; }
});

const feeForGrade = computed(() => info.value.applicationFeeByGrade[gradeLevel.value] || 0);
const selectedChild = computed(() => info.value.children.find((c) => c._id === sourceStudentId.value));
const onFile = (e) => { proofFile.value = e.target.files?.[0] || null; };

async function submitApplication() {
  error.value = '';
  if (!gradeLevel.value) { error.value = 'Select the grade to enroll in.'; return; }
  if (mode.value === 'returning' && !sourceStudentId.value) { error.value = 'Select which child to re-enroll.'; return; }
  if (mode.value === 'new' && (!newStudent.value.surname || !newStudent.value.givenName)) { error.value = 'Enter the student surname and first name.'; return; }
  busy.value = true;
  try {
    const body = mode.value === 'returning'
      ? { sourceStudentId: sourceStudentId.value, gradeLevel: gradeLevel.value }
      : { student: newStudent.value, gradeLevel: gradeLevel.value };
    const { data } = await http.post('/apply/parent', body);
    appId.value = data.id; appFee.value = data.applicationFee; info.value.payoutAccounts = data.payoutAccounts;
    step.value = 2;
  } catch (e) { error.value = e?.response?.data?.message || 'Could not submit. Please try again.'; }
  finally { busy.value = false; }
}
async function submitFee() {
  error.value = '';
  if (!feeForm.value.referenceNo) { error.value = 'Enter the payment reference number.'; return; }
  busy.value = true;
  try {
    const fd = new FormData();
    fd.append('method', feeForm.value.method);
    fd.append('referenceNo', feeForm.value.referenceNo);
    if (proofFile.value) fd.append('proof', proofFile.value);
    await http.post(`/apply/${appId.value}/fee`, fd);
    step.value = 3;
  } catch (e) { error.value = e?.response?.data?.message || 'Could not submit payment. Please try again.'; }
  finally { busy.value = false; }
}
</script>

<template>
  <div class="mx-auto max-w-lg text-[#241b33]">
    <p class="mb-6 text-lg text-slate-600">Enroll a child for the current school year.</p>
    <p v-if="error" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>

    <div v-if="step === 1" class="space-y-4 rounded-2xl border border-[#e5e0f7] bg-white p-6">
      <div class="flex flex-wrap gap-2">
        <button class="rounded-xl border-2 px-4 py-2.5 text-left" :class="mode === 'returning' ? 'border-[#6d28d9] bg-[#6d28d9] text-white' : 'border-slate-300 text-slate-700'" @click="mode = 'returning'">
          <span class="block font-semibold">Returning child</span><span class="text-sm" :class="mode==='returning' ? 'text-white/80' : 'text-slate-500'">Already enrolled before</span>
        </button>
        <button class="rounded-xl border-2 px-4 py-2.5 text-left" :class="mode === 'new' ? 'border-[#6d28d9] bg-[#6d28d9] text-white' : 'border-slate-300 text-slate-700'" @click="mode = 'new'">
          <span class="block font-semibold">New child</span><span class="text-sm" :class="mode==='new' ? 'text-white/80' : 'text-slate-500'">First-time enrollee</span>
        </button>
      </div>

      <template v-if="mode === 'returning'">
        <label class="block"><span class="text-lg font-semibold">Which child?</span>
          <select v-model="sourceStudentId" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg">
            <option value="" disabled>Select…</option>
            <option v-for="c in info.children" :key="c._id" :value="c._id">{{ c.surname }}, {{ c.givenName }} ({{ gLabel(c.gradeLevel) }})</option>
          </select>
          <span v-if="!info.children.length" class="mt-1 block text-sm text-slate-500">No existing children. Use "New child" instead.</span>
        </label>
        <p v-if="selectedChild" class="text-sm text-slate-500">Current record: {{ gLabel(selectedChild.gradeLevel) }} · LRN: {{ selectedChild.lrn || '—' }}</p>
      </template>

      <template v-else>
        <div class="grid gap-3 sm:grid-cols-2">
          <input v-model="newStudent.surname" placeholder="Surname" class="rounded-lg border border-slate-300 p-3" />
          <input v-model="newStudent.givenName" placeholder="First name" class="rounded-lg border border-slate-300 p-3" />
          <input v-model="newStudent.middleName" placeholder="Middle name" class="rounded-lg border border-slate-300 p-3" />
          <input v-model="newStudent.lrn" placeholder="LRN (if any)" class="rounded-lg border border-slate-300 p-3 tabular-nums" />
          <label class="text-sm text-slate-500">Birthdate<input v-model="newStudent.birthdate" type="date" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-base text-[#241b33]" /></label>
          <select v-model="newStudent.gender" class="rounded-lg border border-slate-300 p-3"><option value="">— gender —</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select>
        </div>
      </template>

      <label class="block"><span class="text-lg font-semibold">Grade to enroll in</span>
        <select v-model="gradeLevel" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg">
          <option value="" disabled>Select grade…</option>
          <option v-for="g in info.grades" :key="g" :value="g">{{ gLabel(g) }}</option>
        </select>
      </label>
      <p v-if="gradeLevel" class="rounded-lg bg-[#f5f3ff] px-4 py-2 text-[#4c1d95]">Application fee: <b>{{ peso(feeForGrade) }}</b></p>

      <button class="inline-flex min-h-[54px] w-full items-center justify-center rounded-xl bg-[#6d28d9] text-lg font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="busy" @click="submitApplication">{{ busy ? 'Submitting…' : 'Continue to payment' }}</button>
    </div>

    <div v-else-if="step === 2" class="space-y-4 rounded-2xl border border-[#e5e0f7] bg-white p-6">
      <h2 class="text-xl font-bold text-[#5b21b6]">Pay the Application Fee</h2>
      <p class="text-lg">Application fee: <b>{{ peso(appFee) }}</b></p>
      <div v-if="info.payoutAccounts.length" class="rounded-xl bg-[#f5f3ff] p-4">
        <p class="font-semibold text-[#4c1d95]">Send the payment to:</p>
        <ul class="mt-1 space-y-1"><li v-for="a in info.payoutAccounts" :key="a.number"><span class="font-semibold">{{ a.label || a.method }}</span> · <span class="tabular-nums">{{ a.number }}</span></li></ul>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <select v-model="feeForm.method" class="rounded-lg border border-slate-300 p-3">
          <option v-for="a in info.payoutAccounts" :key="a.method + a.number" :value="a.method">{{ a.label || a.method }}</option>
          <option v-if="!info.payoutAccounts.length" value="GCASH">GCash</option>
        </select>
        <input v-model="feeForm.referenceNo" placeholder="Reference number" class="rounded-lg border border-slate-300 p-3 tabular-nums" />
      </div>
      <label class="block text-sm text-slate-500">Proof of payment (optional)<input type="file" accept="image/*" class="mt-1 w-full text-base" @change="onFile" /></label>
      <button class="inline-flex min-h-[54px] w-full items-center justify-center rounded-xl bg-[#6d28d9] text-lg font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="busy" @click="submitFee">{{ busy ? 'Submitting…' : 'Submit application' }}</button>
    </div>

    <div v-else class="rounded-2xl bg-[#dcfce7] p-6 text-center">
      <p class="text-2xl font-bold text-[#15803d]">Application submitted!</p>
      <p class="mt-2 text-slate-700">The school will review your application fee. Once approved, the enrollment will appear in your balance.</p>
      <router-link to="/portal" class="mt-4 inline-block text-lg font-semibold text-[#4c1d95] underline">Back to balance</router-link>
    </div>
  </div>
</template>