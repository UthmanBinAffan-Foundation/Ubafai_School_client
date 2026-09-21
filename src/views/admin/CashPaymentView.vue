<script setup>
import { ref, computed, watch } from 'vue';
import { onMounted } from 'vue';
import http from '@/api/http';
import { useToast } from '@/toast';

const toast = useToast();
const students = ref([]);
const items = ref([]);
const payments = ref([]);
const selected = ref({});          // key -> bool
const adjInputs = ref({});         // key -> payment adjustment (+ add / - deduct)
const amount = ref(null);
const form = ref({ student: '', referenceNo: '', paymentDate: new Date().toISOString().slice(0, 10) });
const loadingLedger = ref(false); const saving = ref(false);
const done = ref(''); const error = ref('');

const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;
const prettyLevel = (g) => (g || '').replace('_', ' ');
const studentName = (s) => `${s.surname}, ${s.givenName} (${prettyLevel(s.gradeLevel)})`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '\u2014');
const fmtDates = (arr) => (arr && arr.length ? arr.map((d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })).join(', ') : '—');
const statusText = (s) => (s === 'PAID' ? 'Paid' : s === 'PARTIAL' ? 'Partially Paid' : 'Not Paid');
const statusClass = (s) => (s === 'PAID' ? 'bg-[#dcfce7] text-[#15803d]' : s === 'PARTIAL' ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#fee2e2] text-[#b91c1c]');
const totalBalance = computed(() => items.value.reduce((s, i) => s + (i.balance || 0), 0));

onMounted(async () => {
  try { students.value = (await http.get('/students')).data; } catch { error.value = 'Could not load data.'; }
});

async function loadLedger(id) {
  items.value = []; payments.value = []; selected.value = {}; amount.value = null; adjInputs.value = {};
  if (!id) return;
  loadingLedger.value = true;
  try {
    const [it, led] = await Promise.all([
      http.get(`/students/${id}/ledger-items`),
      http.get(`/students/${id}/ledger`),
    ]);
    items.value = it.data.items;
    items.value.forEach((x) => { adjInputs.value[x.key] = x.adjustment || 0; });
    payments.value = led.data.payments || [];
  } catch { /* ignore */ }
  finally { loadingLedger.value = false; }
}

const badge = (s) => (s === 'VERIFIED' ? 'bg-[#dcfce7] text-[#15803d]' : s === 'REJECTED' ? 'bg-[#fee2e2] text-[#b91c1c]' : s === 'REVERSED' ? 'bg-slate-200 text-slate-600' : 'bg-[#fef3c7] text-[#b45309]');
async function reversePayment(p) {
  if (p.status !== 'VERIFIED') return;
  const reason = prompt('Reason for reversing this payment? (optional)');
  if (reason === null) return;
  try { await http.post(`/payments/${p._id}/reverse`, { reason }); done.value = 'Payment reversed. Balance restored.'; await loadLedger(form.value.student); }
  catch { error.value = 'Could not reverse.'; }
}
async function applyAdjustment(it) {
  try {
    await http.patch(`/students/${form.value.student}/item-discount`, { key: it.key, adjustment: Number(adjInputs.value[it.key]) || 0 });
    toast.success(`Adjustment applied to ${it.label}.`);
    await loadLedger(form.value.student);
  } catch (e) { toast.error(e?.response?.data?.message || 'Could not apply adjustment.'); }
}
watch(() => form.value.student, (id) => loadLedger(id));

function toggle(key) {
  selected.value[key] = !selected.value[key];
  amount.value = items.value.filter((i) => selected.value[i.key]).reduce((s, i) => s + i.balance, 0) || null;
}
const selectedKeys = computed(() => Object.keys(selected.value).filter((k) => selected.value[k]));

async function submit() {
  error.value = ''; done.value = '';
  if (!form.value.student || !selectedKeys.value.length || !amount.value) { toast.warn('Please tick at least one fee and enter an amount.'); return; }
  saving.value = true;
  try {
    await http.post('/payments', {
      student: form.value.student, amount: amount.value, method: 'CASH',
      referenceNo: form.value.referenceNo, paymentDate: form.value.paymentDate,
      payKeys: JSON.stringify(selectedKeys.value),
    });
    done.value = 'Cash payment recorded (auto-verified). Balance updated.';
    await loadLedger(form.value.student);
  } catch (e) { error.value = e?.response?.data?.message || 'Could not record. Please try again.'; }
  finally { saving.value = false; }
}
</script>

<template>
  <div class="text-[#241b33]">
    <p class="mb-4 text-lg text-slate-600">For those who paid cash at the school. Automatically verified.</p>
    <p v-if="done" class="mb-4 rounded-xl bg-[#dcfce7] px-5 py-3 font-semibold text-[#15803d]">{{ done }}</p>
    <p v-if="error" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>

    <label class="block max-w-lg"><span class="text-lg font-semibold">Student</span>
      <select v-model="form.student" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg">
        <option value="" disabled>Select…</option>
        <option v-for="s in students" :key="s._id" :value="s._id">{{ studentName(s) }}</option>
      </select>
    </label>

    <div v-if="form.student" class="mt-4 space-y-4">
      <p v-if="loadingLedger" class="text-slate-500">Loading ledger…</p>
      <template v-else>
        <div class="flex items-baseline justify-between">
          <h2 class="text-lg font-bold text-[#5b21b6]">Student Ledger</h2>
          <span class="font-bold tabular-nums" :class="totalBalance > 0 ? 'text-[#b91c1c]' : 'text-[#15803d]'">Total balance: {{ peso(totalBalance) }}</span>
        </div>

        <div class="overflow-x-auto rounded-2xl border border-[#e5e0f7] bg-white">
          <table class="w-full min-w-[720px] text-left text-sm">
            <thead class="bg-[#f5f3ff] text-[#4c1d95]">
              <tr><th class="p-2">Pay</th><th class="p-2">Fees</th><th class="p-2">Due date</th><th class="p-2">Status</th><th class="p-2 text-right">Adjustment<br /><span class="text-[10px] font-normal text-slate-400">(+ add / − less)</span></th><th class="p-2 text-right">Paid</th><th class="p-2">Payment dates</th><th class="p-2 text-right">Balance</th><th class="p-2">Remarks</th></tr>
            </thead>
            <tbody>
              <tr v-for="it in items" :key="it.key" class="border-t border-[#f1eefb]" :class="selected[it.key] ? 'bg-[#f5f3ff]' : ''">
                <td class="p-2 text-center">
                  <input v-if="it.payable" type="checkbox" :checked="selected[it.key]" @change="toggle(it.key)" />
                  <span v-else title="locked">🔒</span>
                </td>
                <td class="p-2 font-semibold">{{ it.label }}<span v-if="!it.payable && it.reason" class="block text-xs font-normal text-[#b91c1c]">{{ it.reason }}</span></td>
                <td class="p-2 text-slate-600">{{ fmtDate(it.dueDate) }}</td>
                <td class="p-2"><span class="rounded px-2 py-0.5 text-xs font-semibold" :class="statusClass(it.status)">{{ statusText(it.status) }}</span></td>
                <td class="p-2 text-right">
                  <input v-model.number="adjInputs[it.key]" type="number" class="w-24 rounded border border-slate-300 p-1 text-right tabular-nums" @blur="applyAdjustment(it)" @keyup.enter="applyAdjustment(it)" />
                </td>
                <td class="p-2 text-right tabular-nums text-[#15803d]">{{ peso(it.amountPaid) }}</td>
                <td class="p-2 text-slate-600">{{ fmtDates(it.paymentDates) }}</td>
                <td class="p-2 text-right tabular-nums font-semibold" :class="it.balance > 0 ? 'text-[#b91c1c]' : 'text-[#15803d]'">{{ peso(it.balance) }}</td>
                <td class="p-2 text-slate-500">{{ it.remarks }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Payment inputs -->
        <div class="grid gap-3 rounded-2xl border border-[#e5e0f7] bg-white p-4 sm:grid-cols-3">
          <label class="block"><span class="font-semibold">Amount</span>
            <input v-model.number="amount" type="number" placeholder="0" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg tabular-nums" />
            <span class="mt-1 block text-xs text-slate-500">Auto-filled from selection. Lower it for partial.</span>
          </label>
          <label class="block"><span class="font-semibold">Date</span>
            <input v-model="form.paymentDate" type="date" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg" /></label>
          <label class="block"><span class="font-semibold">OR / Receipt No. <span class="font-normal text-slate-500">(optional)</span></span>
            <input v-model="form.referenceNo" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg tabular-nums" /></label>
        </div>
        <button class="inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-[#6d28d9] px-6 text-xl font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60"
          :disabled="saving" @click="submit">{{ saving ? 'Recording…' : 'Record cash payment' }}</button>
        <p class="text-sm text-slate-500">Check the fee(s) to pay. The amount is distributed across your selection in order — a shortfall makes the last one partially paid.</p>

        <!-- Payment History (Print / Reverse) -->
        <section v-if="payments.length" class="rounded-2xl border border-[#e5e0f7] bg-white p-4">
          <h2 class="mb-2 text-lg font-bold text-[#5b21b6]">Payment History</h2>
          <ul class="space-y-2">
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
      </template>
    </div>
  </div>
</template>
