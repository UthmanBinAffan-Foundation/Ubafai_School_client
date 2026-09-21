<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import http from '@/api/http';

const route = useRoute();
const student = ref(null);
const returning = ref(false); const assessment = ref(null); const payments = ref([]); const items = ref([]);
const loading = ref(false); const error = ref(''); const msg = ref('');
const editing = ref(false); const form = ref({});
const lineEdits = ref({}); const showDisc = ref(false);
const savingDisc = ref(false); const savingStudent = ref(false);

const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;
const prettyLevel = (g) => (g || '').replace('_', ' ');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '\u2014');
const fmtDates = (arr) => (arr && arr.length ? arr.map((d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })).join(', ') : '—');
const statusText = (s) => (s === 'PAID' ? 'Paid' : s === 'PARTIAL' ? 'Partially Paid' : 'Not Paid');
const statusClass = (s) => (s === 'PAID' ? 'bg-[#dcfce7] text-[#15803d]' : s === 'PARTIAL' ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#fee2e2] text-[#b91c1c]');
const badge = (s) => (s === 'VERIFIED' ? 'bg-[#dcfce7] text-[#15803d]' : s === 'REJECTED' ? 'bg-[#fee2e2] text-[#b91c1c]' : s === 'REVERSED' ? 'bg-slate-200 text-slate-600' : 'bg-[#fef3c7] text-[#b45309]');
async function reversePayment(p) {
  if (p.status !== 'VERIFIED') return;
  const reason = prompt('Reason for reversing this payment? (optional)');
  if (reason === null) return;
  try { await http.post(`/payments/${p._id}/reverse`, { reason }); msg.value = 'Payment reversed. Balance restored.'; await load(); }
  catch { error.value = 'Could not reverse.'; }
}
const totalBalance = computed(() => items.value.reduce((s, i) => s + (i.balance || 0), 0));
const GRADE_LEVELS = [['NURSERY', 'Nursery'], ['KINDER_1', 'Kinder 1'], ['KINDER_2', 'Kinder 2'], ['GRADE_1', 'Grade 1'], ['GRADE_2', 'Grade 2'], ['GRADE_3', 'Grade 3'], ['GRADE_4', 'Grade 4'], ['GRADE_5', 'Grade 5'], ['GRADE_6', 'Grade 6']];

async function load() {
  loading.value = true; error.value = '';
  try {
    const [led, it] = await Promise.all([
      http.get(`/students/${route.params.id}/ledger`),
      http.get(`/students/${route.params.id}/ledger-items`),
    ]);
    student.value = led.data.student; assessment.value = led.data.assessment;
    payments.value = (led.data.payments || []).slice().sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    returning.value = !!led.data.returning;
    items.value = it.data.items;
    form.value = { surname: student.value.surname, givenName: student.value.givenName, middleName: student.value.middleName || '', lrn: student.value.lrn || '', gradeLevel: student.value.gradeLevel, section: student.value.section || '', gender: student.value.gender || '', status: student.value.status };
    lineEdits.value = {}; (assessment.value?.lines || []).forEach((l) => { lineEdits.value[l._id] = { amountDue: l.amountDue, unlocked: !!l.unlocked }; });
  } catch { error.value = 'Could not load the ledger.'; }
  finally { loading.value = false; }
}
onMounted(load);

async function saveStudent() {
  savingStudent.value = true; msg.value = ''; error.value = '';
  try { await http.patch(`/students/${route.params.id}`, form.value); editing.value = false; msg.value = 'Student updated.'; await load(); }
  catch { error.value = 'Could not update.'; } finally { savingStudent.value = false; }
}
async function toggleStatus() {
  const next = student.value.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  try { await http.patch(`/students/${route.params.id}`, { status: next }); await load(); } catch { error.value = 'Could not change status.'; }
}
async function saveLedgerLines() {
  savingDisc.value = true; msg.value = ''; error.value = '';
  try { await http.patch(`/students/${route.params.id}/ledger-lines`, { lines: lineEdits.value }); msg.value = 'Ledger updated for this student.'; await load(); }
  catch { error.value = 'Could not save changes.'; }
  finally { savingDisc.value = false; }
}
</script>

<template>
  <div class="text-[#241b33]">
    <router-link to="/admin/masterlist" class="text-lg font-semibold text-[#4c1d95] underline">&larr; Back to Masterlist</router-link>
    <p v-if="msg" class="mt-3 rounded-xl bg-[#dcfce7] px-5 py-3 font-semibold text-[#15803d]">{{ msg }}</p>
    <p v-if="error" class="mt-3 rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>
    <p v-if="loading" class="py-10 text-center text-xl text-slate-600">Loading…</p>

    <div v-else-if="student" class="mt-3 space-y-6">
      <!-- Student info -->
      <section class="rounded-2xl border border-[#e5e0f7] bg-white p-5">
        <div v-if="!editing" class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-2xl font-bold">{{ student.surname }}, {{ student.givenName }} {{ student.middleName }}
              <span class="ml-2 rounded px-2 py-0.5 text-sm font-semibold align-middle" :class="returning ? 'bg-[#dbeafe] text-[#1e40af]' : 'bg-[#dcfce7] text-[#15803d]'">{{ returning ? 'Returning student' : 'New student' }}</span></p>
            <p class="text-slate-600">{{ prettyLevel(student.gradeLevel) }}{{ student.section }} &middot; LRN: {{ student.lrn || '—' }}
              <span class="ml-2 rounded px-2 py-0.5 text-sm font-semibold" :class="student.status === 'ACTIVE' ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#b91c1c]'">{{ student.status }}</span>
            </p>
            <p v-if="student.guardians?.length" class="mt-1 text-slate-600">Parent: {{ student.guardians.map(g => g.name).join(', ') }}</p>
          </div>
          <div class="flex gap-2">
            <button class="rounded-lg border-2 border-[#4c1d95] px-3 py-2 font-semibold text-[#4c1d95] hover:bg-[#f5f3ff]" @click="editing = true">Edit</button>
            <button class="rounded-lg border-2 px-3 py-2 font-semibold" :class="student.status === 'ACTIVE' ? 'border-[#b91c1c] text-[#b91c1c]' : 'border-[#15803d] text-[#15803d]'" @click="toggleStatus">{{ student.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}</button>
          </div>
        </div>
        <div v-else class="space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <input v-model="form.surname" placeholder="Surname" class="rounded-lg border border-slate-300 p-3" />
            <input v-model="form.givenName" placeholder="First name" class="rounded-lg border border-slate-300 p-3" />
            <input v-model="form.middleName" placeholder="Middle name" class="rounded-lg border border-slate-300 p-3" />
            <input v-model="form.lrn" placeholder="LRN" class="rounded-lg border border-slate-300 p-3 tabular-nums" />
            <select v-model="form.gradeLevel" class="rounded-lg border border-slate-300 p-3"><option v-for="[v, l] in GRADE_LEVELS" :key="v" :value="v">{{ l }}</option></select>
            <input v-model="form.section" maxlength="2" placeholder="Section (e.g. A)" class="rounded-lg border border-slate-300 p-3 uppercase" />
            <select v-model="form.gender" class="rounded-lg border border-slate-300 p-3"><option value="">— gender —</option><option value="MALE">Male</option><option value="FEMALE">Female</option></select>
          </div>
          <div class="flex gap-2">
            <button class="rounded-xl bg-[#6d28d9] px-5 py-2.5 font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="savingStudent" @click="saveStudent">Save</button>
            <button class="rounded-xl border-2 border-slate-400 px-5 py-2.5 font-semibold text-slate-700" @click="editing = false">Cancel</button>
          </div>
        </div>
      </section>

      <!-- Ledger (grouped) -->
      <section class="rounded-2xl border border-[#e5e0f7] bg-white p-5">
        <div class="mb-2 flex items-baseline justify-between">
          <h2 class="text-xl font-bold text-[#5b21b6]">Ledger</h2>
          <span class="font-bold tabular-nums" :class="totalBalance > 0 ? 'text-[#b91c1c]' : 'text-[#15803d]'">Balance: {{ peso(totalBalance) }}</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[680px] text-left text-sm">
            <thead class="bg-[#f5f3ff] text-[#4c1d95]"><tr><th class="p-2">Fees</th><th class="p-2">Due date</th><th class="p-2">Status</th><th class="p-2 text-right">Paid</th><th class="p-2">Payment dates</th><th class="p-2 text-right">Balance</th><th class="p-2">Remarks</th></tr></thead>
            <tbody>
              <tr v-for="it in items" :key="it.key" class="border-t border-[#f1eefb]">
                <td class="p-2 font-semibold">{{ it.label }}</td>
                <td class="p-2 text-slate-600">{{ fmtDate(it.dueDate) }}</td>
                <td class="p-2"><span class="rounded px-2 py-0.5 text-xs font-semibold" :class="statusClass(it.status)">{{ statusText(it.status) }}</span></td>
                <td class="p-2 text-right tabular-nums text-[#15803d]">{{ peso(it.amountPaid) }}</td>
                <td class="p-2 text-slate-600">{{ fmtDates(it.paymentDates) }}</td>
                <td class="p-2 text-right tabular-nums font-semibold" :class="it.balance > 0 ? 'text-[#b91c1c]' : 'text-[#15803d]'">{{ peso(it.balance) }}</td>
                <td class="p-2 text-slate-500">{{ it.remarks }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Payment history -->
      <section class="rounded-2xl border border-[#e5e0f7] bg-white p-5">
        <h2 class="mb-3 text-xl font-bold text-[#5b21b6]">Payment History</h2>
        <p v-if="!payments.length" class="text-slate-500">No payments yet.</p>
        <ul v-else class="space-y-2">
          <li v-for="p in payments" :key="p._id" class="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1eefb] pb-2">
            <div>
              <span class="font-semibold tabular-nums">{{ peso(p.amount) }}</span>
              <span class="ml-2 text-slate-500">{{ p.method }}</span>
              <span v-if="p.referenceNo" class="ml-2 text-slate-500 tabular-nums">#{{ p.referenceNo }}</span>
              <span class="ml-2 text-slate-400">{{ fmtDateTime(p.paymentDate) }}</span>
              <span v-if="p.receiptNo" class="ml-2 text-slate-400 tabular-nums">{{ p.receiptNo }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded px-2 py-0.5 text-sm font-semibold" :class="badge(p.status)">{{ p.status }}</span>
              <router-link v-if="p.status === 'VERIFIED'" :to="'/admin/receipt/' + p._id" class="rounded border border-[#4c1d95] px-2 py-1 text-xs font-semibold text-[#4c1d95]">Print</router-link>
              <button v-if="p.status === 'VERIFIED'" class="rounded border border-[#b91c1c] px-2 py-1 text-xs font-semibold text-[#b91c1c]" @click="reversePayment(p)">Reverse</button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Edit fees for this student (amount + unlock) -->
      <section class="rounded-2xl border border-[#e5e0f7] bg-white p-5">
        <button class="text-lg font-bold text-[#5b21b6] underline" @click="showDisc = !showDisc">{{ showDisc ? 'Hide' : 'Edit' }} fees for this student</button>
        <div v-if="showDisc && assessment" class="mt-3 overflow-x-auto">
          <p class="mb-2 text-sm text-slate-500">Baguhin ang halaga o i-unlock ang isang fee para sa estudyanteng ito LANG. Hindi maaapektuhan ang ibang estudyante.</p>
          <table class="w-full min-w-[560px] text-left text-sm">
            <thead class="bg-[#f5f3ff] text-[#4c1d95]"><tr><th class="p-2">Fee</th><th class="p-2 text-right">Amount</th><th class="p-2 text-center">Unlock</th><th class="p-2 text-right">Paid</th></tr></thead>
            <tbody>
              <tr v-for="l in assessment.lines" :key="l._id" class="border-t border-[#f1eefb]">
                <td class="p-2">{{ l.label }}</td>
                <td class="p-2 text-right"><input v-model.number="lineEdits[l._id].amountDue" type="number" min="0" class="w-28 rounded border border-slate-300 p-1 text-right tabular-nums" /></td>
                <td class="p-2 text-center"><input type="checkbox" v-model="lineEdits[l._id].unlocked" class="h-5 w-5" /></td>
                <td class="p-2 text-right tabular-nums text-[#15803d]">{{ peso(l.amountPaid) }}</td>
              </tr>
            </tbody>
          </table>
          <button class="mt-3 rounded-xl bg-[#6d28d9] px-5 py-2.5 font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="savingDisc" @click="saveLedgerLines">{{ savingDisc ? 'Saving…' : 'Save changes' }}</button>
        </div>
      </section>
    </div>
  </div>
</template>
