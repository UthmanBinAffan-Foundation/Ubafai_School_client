<script setup>
import { ref, computed, onMounted } from 'vue';
import http from '@/api/http';

const GRADE_LABEL = { NURSERY: 'Nursery', KINDER_1: 'Kinder 1', KINDER_2: 'Kinder 2', GRADE_1: 'Grade 1', GRADE_2: 'Grade 2', GRADE_3: 'Grade 3', GRADE_4: 'Grade 4', GRADE_5: 'Grade 5', GRADE_6: 'Grade 6' };
const gLabel = (g) => GRADE_LABEL[g] || g;
const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;

const step = ref(1);
const info = ref({ schoolName: '', grades: [], applicationFeeByGrade: {}, payoutAccounts: [] });
const student = ref({ surname: '', givenName: '', middleName: '', lrn: '', birthdate: '', gender: '', gradeLevel: '' });
const guardian = ref({ name: '', mobile: '', email: '', username: '', password: '' });
const confirmPw = ref('');
const appId = ref(''); const appFee = ref(0);
const feeForm = ref({ method: 'GCASH', referenceNo: '' });
const proofFile = ref(null);
const busy = ref(false); const error = ref('');

onMounted(async () => {
  try { info.value = (await http.get('/apply/info')).data; }
  catch { error.value = 'Could not load. Please try again later.'; }
});
const feeForGrade = computed(() => info.value.applicationFeeByGrade[student.value.gradeLevel] || 0);
const onFile = (e) => { proofFile.value = e.target.files?.[0] || null; };

async function submitApplication() {
  error.value = '';
  if (!student.value.surname || !student.value.givenName || !student.value.gradeLevel || !guardian.value.name) {
    error.value = 'Fill in the student surname, first name, grade, and parent name.'; return;
  }
  if (!guardian.value.username || guardian.value.username.length < 3) { error.value = 'Choose a username (at least 3 characters).'; return; }
  if (!guardian.value.password || guardian.value.password.length < 4) { error.value = 'Choose a password (at least 4 characters).'; return; }
  if (guardian.value.password !== confirmPw.value) { error.value = 'The passwords do not match.'; return; }
  busy.value = true;
  try {
    const { data } = await http.post('/apply', { student: student.value, guardian: guardian.value });
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
    await http.post(`/apply/${appId.value}/fee`, { method: feeForm.value.method, referenceNo: feeForm.value.referenceNo });
    step.value = 3;
  } catch (e) { error.value = e?.response?.data?.message || 'Could not submit payment. Please try again.'; }
  finally { busy.value = false; }
}
</script>

<template>
  <div class="mx-auto mt-8 max-w-xl">
    <div class="mb-5 text-center">
      <div class="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6d28d9] to-[#4c1d95] text-xl font-bold text-white">U</div>
      <h1 class="text-2xl font-bold text-[#4c1d95]">Enrollment Application</h1>
      <p class="text-slate-500">{{ info.schoolName }}</p>
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>

    <!-- Step 1: student + parent -->
    <div v-if="step === 1" class="space-y-4 rounded-2xl border border-[#e5e0f7] bg-white p-6">
      <h2 class="text-xl font-bold text-[#5b21b6]">Student Information</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <input v-model="student.surname" placeholder="Surname" class="rounded-lg border border-slate-300 p-3" />
        <input v-model="student.givenName" placeholder="First name" class="rounded-lg border border-slate-300 p-3" />
        <input v-model="student.middleName" placeholder="Middle name" class="rounded-lg border border-slate-300 p-3" />
        <input v-model="student.lrn" placeholder="LRN (if any)" class="rounded-lg border border-slate-300 p-3 tabular-nums" />
        <label class="text-sm text-slate-500">Birthdate<input v-model="student.birthdate" type="date" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-base text-[#241b33]" /></label>
        <select v-model="student.gender" class="rounded-lg border border-slate-300 p-3"><option value="">— gender —</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select>
        <select v-model="student.gradeLevel" class="rounded-lg border border-slate-300 p-3 sm:col-span-2">
          <option value="" disabled>Select grade to enroll in…</option>
          <option v-for="g in info.grades" :key="g" :value="g">{{ gLabel(g) }}</option>
        </select>
      </div>
      <p v-if="student.gradeLevel" class="rounded-lg bg-[#f5f3ff] px-4 py-2 text-[#4c1d95]">Application fee: <b>{{ peso(feeForGrade) }}</b></p>

      <h2 class="pt-2 text-xl font-bold text-[#5b21b6]">Parent / Guardian</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <input v-model="guardian.name" placeholder="Parent/guardian name" class="rounded-lg border border-slate-300 p-3 sm:col-span-2" />
        <input v-model="guardian.mobile" placeholder="Mobile number" class="rounded-lg border border-slate-300 p-3 tabular-nums" />
        <input v-model="guardian.email" placeholder="Email (optional)" class="rounded-lg border border-slate-300 p-3" />
      </div>

      <h2 class="pt-2 text-xl font-bold text-[#5b21b6]">Create Your Login</h2>
      <p class="text-slate-600">Choose a username and password. You will use these to log in once the school approves your application.</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <input v-model="guardian.username" placeholder="Username" class="rounded-lg border border-slate-300 p-3 lowercase" />
        <input v-model="guardian.password" type="password" placeholder="Password" class="rounded-lg border border-slate-300 p-3" />
        <input v-model="confirmPw" type="password" placeholder="Confirm password" class="rounded-lg border border-slate-300 p-3 sm:col-span-2" />
      </div>
      <button class="inline-flex min-h-[54px] w-full items-center justify-center rounded-xl bg-[#6d28d9] text-lg font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="busy" @click="submitApplication">{{ busy ? 'Submitting…' : 'Continue to payment' }}</button>
      <p class="text-center"><router-link to="/login" class="text-[#4c1d95] underline">Already have an account? Log in</router-link></p>
    </div>

    <!-- Step 2: application fee payment -->
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
          <option value="GCASH" v-if="!info.payoutAccounts.length">GCash</option>
        </select>
        <input v-model="feeForm.referenceNo" placeholder="Reference number" class="rounded-lg border border-slate-300 p-3 tabular-nums" />
      </div>
      <button class="inline-flex min-h-[54px] w-full items-center justify-center rounded-xl bg-[#6d28d9] text-lg font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="busy" @click="submitFee">{{ busy ? 'Submitting…' : 'Submit application' }}</button>
    </div>

    <!-- Step 3: done -->
    <div v-else class="rounded-2xl bg-[#dcfce7] p-6 text-center">
      <p class="text-2xl font-bold text-[#15803d]">Application submitted!</p>
      <p class="mt-2 text-slate-700">The school will review your application fee and, once approved, will contact you with your login. Thank you.</p>
      <router-link to="/login" class="mt-4 inline-block text-lg font-semibold text-[#4c1d95] underline">Go to login</router-link>
    </div>
  </div>
</template>
