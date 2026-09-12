<script setup>
import { ref, onMounted } from 'vue';
import http from '@/api/http';

const GRADE_LEVELS = [
  ['NURSERY', 'Nursery'], ['KINDER_1', 'Kinder 1'], ['KINDER_2', 'Kinder 2'],
  ['GRADE_1', 'Grade 1'], ['GRADE_2', 'Grade 2'], ['GRADE_3', 'Grade 3'],
  ['GRADE_4', 'Grade 4'], ['GRADE_5', 'Grade 5'], ['GRADE_6', 'Grade 6'],
];

const guardians = ref([]);
const guardianMode = ref('existing'); // 'existing' | 'new'
const selectedGuardian = ref('');
const newGuardian = ref({ name: '', mobile: '' });

const student = ref({ surname: '', givenName: '', middleName: '', lrn: '', birthdate: '', gender: '', gradeLevel: '' });

const saving = ref(false);
const error = ref('');
const okName = ref('');          // pangalan ng huling na-enroll
const newCreds = ref(null);      // { username, password } kung bagong magulang

async function loadGuardians() {
  try { guardians.value = (await http.get('/guardians')).data; } catch { /* ok lang */ }
}
onMounted(loadGuardians);

async function submit() {
  error.value = '';
  if (!student.value.surname || !student.value.givenName || !student.value.gradeLevel) {
    error.value = 'Surname, first name, and grade level are required.'; return;
  }
  saving.value = true;
  try {
    let guardianId = selectedGuardian.value;

    // New parent? gawin muna + kunin ang login credentials
    if (guardianMode.value === 'new') {
      if (!newGuardian.value.name) { error.value = "Enter the parent's name."; saving.value = false; return; }
      const { data } = await http.post('/guardians', { name: newGuardian.value.name, mobile: newGuardian.value.mobile });
      guardianId = data.guardian._id;
      newCreds.value = data.credentials;
      // idagdag sa listahan at gawing napiling existing (para madaling i-link ang kapatid)
      guardians.value.push({ _id: data.guardian._id, name: data.guardian.name, mobile: data.guardian.mobile });
      guardianMode.value = 'existing';
      selectedGuardian.value = guardianId;
      newGuardian.value = { name: '', mobile: '' };
    }

    const payload = { ...student.value, guardians: guardianId ? [guardianId] : [] };
    await http.post('/students', payload);

    okName.value = `${student.value.surname}, ${student.value.givenName}`;
    // linisin ang student fields pero panatilihin ang magulang (para sa kapatid)
    student.value = { surname: '', givenName: '', middleName: '', lrn: '', birthdate: '', gender: '', gradeLevel: '' };
  } catch (e) {
    error.value = e?.response?.data?.message || 'Enrollment failed. Please try again.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl text-[#241b33]">
    <p class="mb-6 text-lg text-slate-600">Automatically creates a bill (Assessment) based on grade level.</p>

    <!-- Success + credentials ng bagong magulang -->
    <div v-if="okName" class="mb-4 rounded-xl bg-[#dcfce7] px-5 py-4 text-lg text-[#15803d]">
      <b>Enrolled {{ okName }}.</b> Puwede ka nang mag-enroll ng iba (o ng kapatid — nakapili pa rin ang magulang).
    </div>
    <div v-if="newCreds" class="mb-4 rounded-xl border-2 border-[#6d28d9] bg-white px-5 py-4">
      <p class="text-lg font-bold text-[#5b21b6]">Parent login — write it down / SMS it (shown only once):</p>
      <p class="mt-2 text-xl tabular-nums">Username: <b>{{ newCreds.username }}</b></p>
      <p class="text-xl tabular-nums">Password: <b>{{ newCreds.password }}</b></p>
      <button class="mt-2 text-base text-slate-500 underline" @click="newCreds = null">Close</button>
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-4 text-lg font-semibold text-[#b91c1c]">{{ error }}</p>

    <div class="space-y-5">
      <!-- Student -->
      <div class="space-y-4 rounded-2xl border border-[#e5e0f7] bg-white p-5">
        <h2 class="text-xl font-bold">Student Information</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block"><span class="font-semibold">Surname</span>
            <input v-model="student.surname" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg" /></label>
          <label class="block"><span class="font-semibold">Name</span>
            <input v-model="student.givenName" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg" /></label>
          <label class="block"><span class="font-semibold">Middle name</span>
            <input v-model="student.middleName" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg" /></label>
          <label class="block"><span class="font-semibold">LRN</span>
            <input v-model="student.lrn" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg tabular-nums" /></label>
          <label class="block"><span class="font-semibold">Birthdate</span>
            <input v-model="student.birthdate" type="date" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg" /></label>
          <label class="block"><span class="font-semibold">Grade Level</span>
            <select v-model="student.gradeLevel" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg">
              <option value="" disabled>Select&hellip;</option>
              <option v-for="[val, lbl] in GRADE_LEVELS" :key="val" :value="val">{{ lbl }}</option>
            </select></label>
          <label class="block"><span class="font-semibold">Gender</span>
            <select v-model="student.gender" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg">
              <option value="">— unspecified —</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select></label>
        </div>
      </div>

      <!-- Magulang -->
      <div class="space-y-4 rounded-2xl border border-[#e5e0f7] bg-white p-5">
        <h2 class="text-xl font-bold">Parent / Guardian</h2>
        <div class="flex gap-2">
          <button class="rounded-lg border px-4 py-2 text-lg"
                  :class="guardianMode === 'existing' ? 'border-[#6d28d9] bg-[#5b21b6] text-white' : 'border-slate-300'"
                  @click="guardianMode = 'existing'">Already registered</button>
          <button class="rounded-lg border px-4 py-2 text-lg"
                  :class="guardianMode === 'new' ? 'border-[#6d28d9] bg-[#5b21b6] text-white' : 'border-slate-300'"
                  @click="guardianMode = 'new'">New parent</button>
        </div>

        <label v-if="guardianMode === 'existing'" class="block">
          <span class="font-semibold">Select parent</span>
          <select v-model="selectedGuardian" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg">
            <option value="">— none / link later —</option>
            <option v-for="g in guardians" :key="g._id" :value="g._id">{{ g.name }} <template v-if="g.mobile">({{ g.mobile }})</template></option>
          </select>
          <span class="mt-1 block text-base text-slate-500">For siblings, select the same parent.</span>
        </label>

        <div v-else class="grid gap-3 sm:grid-cols-2">
          <label class="block"><span class="font-semibold">Parent's name</span>
            <input v-model="newGuardian.name" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg" /></label>
          <label class="block"><span class="font-semibold">Mobile number</span>
            <input v-model="newGuardian.mobile" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg tabular-nums" /></label>
          <p class="text-base text-slate-500 sm:col-span-2">A new login will be created — the username/password will be shown afterward.</p>
        </div>
      </div>

      <button
        class="inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-[#6d28d9] px-6 text-xl font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60"
        :disabled="saving" @click="submit">
        {{ saving ? 'Enrolling\u2026' : 'Enroll student' }}
      </button>
    </div>
  </div>
</template>
