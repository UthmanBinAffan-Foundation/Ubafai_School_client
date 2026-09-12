<script setup>
import { ref, onMounted } from 'vue';
import { usePaymentStore } from '@/stores/payments';

const store = usePaymentStore();

// Ang /uploads ay hinahain ng API server (port 5000), hindi ng Vite (5173).
// Tanggalin ang '/api' sa base para makuha ang tamang origin ng larawan.
const fileBase = (import.meta.env.VITE_API_BASE || '').replace(/\/api\/?$/, '');
const proofUrl = (path) => (path ? `${fileBase}${path}` : '');

const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;
const prettyDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
const prettyLevel = (g) => (g || '').replace('_', ' ');

// local UI state
const processingId = ref(null); // aling item ang kasalukuyang ina-aksyunan
const actionError = ref('');
const justApproved = ref('');   // pangalan ng huling na-approve (feedback)
const rejectingId = ref(null);  // aling card ang bukas ang reject panel
const rejectReason = ref('');
const lightbox = ref('');       // naka-enlarge na resibo

const quickReasons = [
  'Reference number does not match',
  'No payment received',
  'Amount is short',
];

const busy = (id) => processingId.value === id;

async function approve(p) {
  actionError.value = '';
  processingId.value = p._id;
  try {
    await store.approve(p._id);
    justApproved.value = `${p.student?.surname}, ${p.student?.givenName}`;
    setTimeout(() => { justApproved.value = ''; }, 4000);
  } catch {
    actionError.value = 'Approval failed. Please try again.';
  } finally {
    processingId.value = null;
  }
}

function openReject(p) {
  rejectingId.value = p._id;
  rejectReason.value = '';
  actionError.value = '';
}
function cancelReject() {
  rejectingId.value = null;
  rejectReason.value = '';
}
async function confirmReject(p) {
  if (!rejectReason.value.trim()) {
    actionError.value = 'Please enter a reason before rejecting.';
    return;
  }
  processingId.value = p._id;
  try {
    await store.reject(p._id, rejectReason.value.trim());
    rejectingId.value = null;
  } catch {
    actionError.value = 'Rejection failed. Please try again.';
  } finally {
    processingId.value = null;
  }
}

onMounted(() => store.fetchPending());
</script>

<template>
  <div class="text-[#241b33]">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <p class="mt-1 text-lg text-slate-600">
          <template v-if="store.pending.length">You have {{ store.pending.length }} payment(s) awaiting approval.</template>
          <template v-else-if="!store.loading">None waiting right now.</template>
        </p>
      </div>
      <button
        class="shrink-0 rounded-xl border-2 border-[#6d28d9] px-5 py-3 text-lg font-semibold text-[#5b21b6] hover:bg-[#5b21b6] hover:text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#6d28d9]/40 disabled:opacity-50"
        :disabled="store.loading"
        @click="store.fetchPending()"
      >Refresh</button>
    </div>

    <p v-if="justApproved" class="mb-4 rounded-xl bg-[#dcfce7] px-5 py-4 text-lg font-semibold text-[#15803d]">
      Approved the payment for {{ justApproved }}. Their balance has been updated.
    </p>
    <p v-if="actionError" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-4 text-lg font-semibold text-[#b91c1c]">
      {{ actionError }}
    </p>

    <p v-if="store.loading" class="py-10 text-center text-xl text-slate-600">Loading payments&hellip;</p>

    <div v-else-if="!store.pending.length" class="rounded-2xl border-2 border-dashed border-[#c4b5fd] bg-white py-16 text-center">
      <p class="text-2xl font-bold text-[#5b21b6]">All done.</p>
      <p class="mt-2 text-lg text-slate-600">No payments waiting. Tap Refresh if a new one comes in.</p>
    </div>

    <ul v-else class="space-y-6">
      <li v-for="p in store.pending" :key="p._id" class="overflow-hidden rounded-2xl border border-[#e5e0f7] bg-white">
        <div class="flex">
          <div class="w-2 shrink-0 bg-[#d9a406]" aria-hidden="true"></div>

          <div class="flex-1 p-5 sm:p-6">
            <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 class="text-2xl font-bold">{{ p.student?.surname }}, {{ p.student?.givenName }}</h2>
              <span class="text-lg text-slate-500">{{ prettyDate(p.paymentDate || p.createdAt) }}</span>
            </div>
            <p class="text-lg text-slate-600">
              {{ prettyLevel(p.student?.gradeLevel) }}
              <template v-if="p.intendedFor?.period"> &middot; Para sa {{ prettyLevel(p.intendedFor.period) }}</template>
            </p>

            <!-- HERO: reference number to match against SMS -->
            <div class="mt-4 rounded-xl bg-[#f5f3ff] p-5">
              <p class="text-base font-semibold text-[#5b21b6]">Match this against your GCash/BDO text:</p>
              <p class="mt-1 break-all font-mono text-4xl font-bold tabular-nums tracking-wider text-[#241b33] sm:text-5xl">
                {{ p.referenceNo || 'No ref' }}
              </p>
              <div class="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xl">
                <span class="font-bold">{{ peso(p.amount) }}</span>
                <span class="rounded-lg bg-white px-3 py-1 text-lg font-semibold text-[#5b21b6] ring-1 ring-[#e5e0f7]">{{ p.method }}</span>
              </div>
            </div>

            <button
              v-if="p.proofImageUrl"
              class="mt-4 inline-flex items-center gap-2 text-lg font-semibold text-[#5b21b6] underline focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#6d28d9]/40"
              @click="lightbox = proofUrl(p.proofImageUrl)"
            >View receipt</button>

            <!-- actions -->
            <div v-if="rejectingId !== p._id" class="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                class="inline-flex min-h-[56px] flex-1 items-center justify-center rounded-xl bg-[#6d28d9] px-6 text-xl font-bold text-white hover:bg-[#5b21b6] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#6d28d9]/40 disabled:opacity-60"
                :disabled="busy(p._id)"
                @click="approve(p)"
              >{{ busy(p._id) ? 'Sandali\u2026' : 'Approve payment' }}</button>
              <button
                class="inline-flex min-h-[56px] items-center justify-center rounded-xl border-2 border-[#b91c1c] px-6 text-xl font-bold text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#b91c1c]/30 disabled:opacity-60 sm:flex-none"
                :disabled="busy(p._id)"
                @click="openReject(p)"
              >Reject</button>
            </div>

            <!-- reject panel (lumalabas kapag pinindot ang Reject) -->
            <div v-else class="mt-5 rounded-xl bg-[#fef2f2] p-4">
              <p class="text-lg font-semibold text-[#b91c1c]">Why reject this?</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="r in quickReasons" :key="r"
                  class="rounded-lg border px-3 py-2 text-base"
                  :class="rejectReason === r ? 'border-[#b91c1c] bg-[#b91c1c] text-white' : 'border-slate-300 bg-white text-slate-700'"
                  @click="rejectReason = r"
                >{{ r }}</button>
              </div>
              <input v-model="rejectReason" placeholder="O maglagay ng sariling dahilan&hellip;" class="mt-3 w-full rounded-lg border border-slate-300 p-3 text-lg" />
              <div class="mt-3 flex flex-col gap-3 sm:flex-row">
                <button
                  class="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#b91c1c] px-6 text-lg font-bold text-white hover:bg-[#991b1b] disabled:opacity-60"
                  :disabled="busy(p._id)"
                  @click="confirmReject(p)"
                >{{ busy(p._id) ? 'Sandali\u2026' : 'Confirm reject' }}</button>
                <button
                  class="inline-flex min-h-[52px] items-center justify-center rounded-xl border-2 border-slate-400 px-6 text-lg font-semibold text-slate-700 hover:bg-slate-100"
                  :disabled="busy(p._id)"
                  @click="cancelReject"
                >Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>

    <!-- lightbox ng resibo -->
    <div v-if="lightbox" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" @click="lightbox = ''">
      <img :src="lightbox" alt="Payment receipt" class="max-h-full max-w-full rounded-lg" />
      <button class="absolute right-4 top-4 rounded-lg bg-white px-4 py-2 text-lg font-bold">Close</button>
    </div>
  </div>
</template>
