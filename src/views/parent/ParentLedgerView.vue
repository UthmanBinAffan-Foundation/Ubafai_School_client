<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import http from '@/api/http';

const route = useRoute();
const data = ref(null); const loading = ref(true); const error = ref('');
import { computed } from 'vue';
const totalBalance = computed(() => (data.value?.items || []).reduce((a, i) => a + (i.balance || 0), 0));
const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;
const GRADE_LABEL = { NURSERY: 'Nursery', KINDER_1: 'Kinder 1', KINDER_2: 'Kinder 2', GRADE_1: 'Grade 1', GRADE_2: 'Grade 2', GRADE_3: 'Grade 3', GRADE_4: 'Grade 4', GRADE_5: 'Grade 5', GRADE_6: 'Grade 6', GRADE_7: 'Grade 7', GRADE_8: 'Grade 8', GRADE_9: 'Grade 9', GRADE_10: 'Grade 10', GRADE_11: 'Grade 11', GRADE_12: 'Grade 12' };
const gLabel = (g) => GRADE_LABEL[g] || g;
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '\u2014');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const statusText = (s) => (s === 'PAID' ? 'Paid' : s === 'PARTIAL' ? 'Partially Paid' : 'Not Paid');
const statusClass = (s) => (s === 'PAID' ? 'text-[#15803d]' : s === 'PARTIAL' ? 'text-[#b45309]' : 'text-[#b91c1c]');

onMounted(async () => {
  try { data.value = (await http.get(`/students/${route.params.id}/parent-ledger`)).data; }
  catch (e) { error.value = e?.response?.data?.message || 'Could not load the ledger.'; }
  finally { loading.value = false; }
});
</script>

<template>
  <div class="text-[#241b33]">
    <router-link to="/portal" class="mb-3 inline-block text-[#4c1d95] underline">&larr; Back</router-link>
    <p v-if="loading" class="text-slate-500">Loading…</p>
    <p v-if="error" class="rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>

    <div v-if="data" class="space-y-4">
      <div>
        <h1 class="text-2xl font-bold text-[#4c1d95]">{{ data.student.name }}</h1>
        <p class="text-slate-600">{{ gLabel(data.student.gradeLevel) }} · School Year {{ data.student.schoolYear }}</p>
      </div>

      <div class="rounded-2xl bg-[#f5f3ff] p-5">
        <p class="text-base font-semibold text-[#5b21b6]">Total Balance</p>
        <p class="mt-1 text-3xl font-bold tabular-nums" :class="totalBalance > 0 ? 'text-[#b91c1c]' : 'text-[#15803d]'">{{ totalBalance > 0 ? peso(totalBalance) : 'Fully paid' }}</p>
      </div>

      <!-- Ledger -->
      <section class="overflow-hidden rounded-2xl border border-[#e5e0f7] bg-white">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[560px] text-left">
            <thead class="bg-[#f5f3ff] text-[#4c1d95]">
              <tr><th class="p-2">Fees</th><th class="p-2">Status</th><th class="p-2 text-right">Paid</th><th class="p-2 text-right">Balance</th><th class="p-2">Remarks</th></tr>
            </thead>
            <tbody>
              <tr v-for="it in data.items" :key="it.key" class="border-t border-[#f1eefb]">
                <td class="p-2 font-medium">{{ it.label }}</td>
                <td class="p-2 font-semibold" :class="statusClass(it.status)">{{ statusText(it.status) }}</td>
                <td class="p-2 text-right tabular-nums">{{ peso(it.amountPaid) }}</td>
                <td class="p-2 text-right tabular-nums">{{ peso(it.balance) }}</td>
                <td class="p-2 text-sm text-slate-500">{{ it.remarks }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Payment history -->
      <section class="rounded-2xl border border-[#e5e0f7] bg-white p-4">
        <h2 class="mb-2 text-lg font-bold text-[#5b21b6]">Payment History</h2>
        <ul v-if="data.payments.length" class="space-y-2">
          <li v-for="(p, i) in data.payments" :key="i" class="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1eefb] pb-2">
            <div>
              <span class="font-semibold tabular-nums">{{ peso(p.amount) }}</span>
              <span class="ml-2 text-slate-500">{{ p.method }}</span>
              <span v-if="p.referenceNo" class="ml-2 text-slate-500 tabular-nums">#{{ p.referenceNo }}</span>
              <span class="ml-2 text-slate-400">{{ fmtDateTime(p.paymentDate) }}</span>
              <span v-if="p.receiptNo" class="ml-2 text-slate-400 tabular-nums">{{ p.receiptNo }}</span>
            </div>
            <span class="rounded px-2 py-0.5 text-sm font-semibold" :class="p.status === 'VERIFIED' ? 'bg-[#dcfce7] text-[#15803d]' : p.status === 'REVERSED' ? 'bg-slate-200 text-slate-600' : p.status === 'REJECTED' ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#fef3c7] text-[#b45309]'">{{ p.status }}</span>
          </li>
        </ul>
        <p v-else class="text-slate-500">No payments recorded.</p>
      </section>
    </div>
  </div>
</template>
