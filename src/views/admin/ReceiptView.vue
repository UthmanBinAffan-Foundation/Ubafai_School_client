<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import http from '@/api/http';

const route = useRoute();
const router = useRouter();
function goBack() { if (window.history.length > 1) router.back(); else router.push('/admin/masterlist'); }
const data = ref(null); const error = ref('');
const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : '—');
const statusText = (s) => (s === 'PAID' ? 'Paid' : s === 'PARTIAL' ? 'Partially Paid' : 'Not Paid');
const prettyLevel = (g) => (g || '').replace('_', ' ');
const totalBalance = computed(() => (data.value?.items || []).reduce((s, i) => s + (i.balance || 0), 0));

onMounted(async () => {
  try { data.value = (await http.get(`/payments/${route.params.id}/receipt`)).data; }
  catch { error.value = 'Could not load the receipt.'; }
});
const doPrint = () => window.print();
</script>

<template>
  <div class="text-[#241b33]">
    <div class="no-print mb-4 flex items-center gap-3">
      <button class="rounded-xl bg-[#6d28d9] px-5 py-2.5 font-bold text-white hover:bg-[#5b21b6]" @click="doPrint">Print (A4)</button>
      <button class="rounded-xl border-2 border-slate-400 px-5 py-2.5 font-semibold text-slate-700" @click="goBack">Back</button>
    </div>
    <p v-if="error" class="rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>

    <div v-if="data" class="printable mx-auto max-w-[800px] bg-white p-8 text-[13px] leading-relaxed" style="border:1px solid #e5e0f7;">
      <!-- Header -->
      <div class="flex items-start justify-between border-b-2 border-[#4c1d95] pb-3">
        <div class="flex items-start gap-3">
          <img src="/logo192.png" alt="Logo" class="h-14 w-14 object-contain" />
          <div>
          <p class="text-xl font-bold text-[#4c1d95]">{{ data.school.name }}</p>
          <p class="text-slate-600">{{ data.school.address }}</p>
          <p class="text-slate-500">School Year: {{ data.schoolYear }}</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-lg font-bold">OFFICIAL RECEIPT</p>
          <p class="tabular-nums">No.: <b>{{ data.payment.receiptNo || '—' }}</b></p>
          <p>Date: {{ fmtDate(data.payment.paymentDate) }}</p>
          <p v-if="data.payment.status === 'REVERSED'" class="mt-1 font-bold text-[#b91c1c]">** REVERSED / VOID **</p>
        </div>
      </div>

      <!-- Student -->
      <div class="mt-3 grid grid-cols-2 gap-2">
        <p><span class="text-slate-500">Student:</span> <b>{{ data.student.name }}</b></p>
        <p><span class="text-slate-500">Grade:</span> {{ prettyLevel(data.student.gradeLevel) }}</p>
        <p><span class="text-slate-500">LRN:</span> {{ data.student.lrn || '—' }}</p>
        <p><span class="text-slate-500">Parent/Guardian:</span> {{ data.student.guardians.join(', ') || '—' }}</p>
      </div>

      <!-- This payment -->
      <p class="mt-4 font-bold text-[#5b21b6]">Payment Received</p>
      <table class="mt-1 w-full border-collapse text-left">
        <thead><tr class="border-b border-slate-300"><th class="py-1">Fee</th><th class="py-1 text-right">Amount</th></tr></thead>
        <tbody>
          <tr v-for="(c, i) in data.covered" :key="i" class="border-b border-slate-100"><td class="py-1">{{ c.label }}</td><td class="py-1 text-right tabular-nums">{{ peso(c.amount) }}</td></tr>
          <tr v-if="!data.covered.length"><td colspan="2" class="py-1 text-slate-500">—</td></tr>
          <tr class="border-t border-slate-300"><td class="py-1 font-bold">Total ({{ data.payment.method }}<span v-if="data.payment.referenceNo"> · Ref {{ data.payment.referenceNo }}</span>)</td><td class="py-1 text-right font-bold tabular-nums">{{ peso(data.payment.amount) }}</td></tr>
        </tbody>
      </table>

      <!-- Full ledger -->
      <p class="mt-5 font-bold text-[#5b21b6]">Student Ledger (Current Status)</p>
      <table class="mt-1 w-full border-collapse text-left">
        <thead><tr class="border-b border-slate-300"><th class="py-1">Fees</th><th class="py-1">Status</th><th class="py-1 text-right">Paid</th><th class="py-1 text-right">Balance</th><th class="py-1">Remarks</th></tr></thead>
        <tbody>
          <tr v-for="it in data.items" :key="it.key" class="border-b border-slate-100">
            <td class="py-1">{{ it.label }}</td>
            <td class="py-1">{{ statusText(it.status) }}</td>
            <td class="py-1 text-right tabular-nums">{{ peso(it.amountPaid) }}</td>
            <td class="py-1 text-right tabular-nums">{{ peso(it.balance) }}</td>
            <td class="py-1 text-slate-500">{{ it.remarks }}</td>
          </tr>
          <tr class="border-t border-slate-300"><td class="py-1 font-bold" colspan="3">Total Balance</td><td class="py-1 text-right font-bold tabular-nums">{{ peso(totalBalance) }}</td><td></td></tr>
        </tbody>
      </table>

      <!-- Footer -->
      <div class="mt-8 flex items-end justify-between">
        <p class="text-slate-500">Printed: {{ fmtDate(new Date()) }}</p>
        <div class="text-center"><div class="mb-1 w-56 border-t border-slate-400"></div><p class="text-slate-500">Authorized Signature</p></div>
      </div>
    </div>
  </div>
</template>
