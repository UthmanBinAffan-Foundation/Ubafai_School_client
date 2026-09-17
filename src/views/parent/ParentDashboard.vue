<script setup>
import { ref, onMounted, computed } from 'vue';
import http from '@/api/http';
import { enablePush, isPushSubscribed } from '@/push';

const children = ref([]);
const history = ref([]);
const previous = computed(() => history.value.filter((h) => !h.isActive));
const loading = ref(false);
const error = ref('');
const lrnMsg = ref('');
const lrnInputs = ref({});
async function saveLrn(c) {
  const val = (lrnInputs.value[c.student._id] || '').trim();
  if (!val) return;
  lrnMsg.value = ''; error.value = '';
  try { await http.patch(`/students/${c.student._id}/lrn`, { lrn: val }); lrnMsg.value = 'LRN saved.'; await load(); }
  catch (e) { error.value = e?.response?.data?.message || 'Could not save LRN.'; }
}

const pushState = ref('idle'); // idle | on | error
const pushMsg = ref('');

const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;
const prettyLevel = (g) => (g || '').replace('_', ' ');

async function load() {
  loading.value = true; error.value = '';
  try {
    const [mine, hist] = await Promise.all([http.get('/students/mine'), http.get('/students/mine/history')]);
    children.value = mine.data;
    history.value = hist.data;
  } catch { error.value = 'Could not load data. Please try again.'; }
  finally { loading.value = false; }
}

async function turnOnPush() {
  pushMsg.value = '';
  try {
    await enablePush();
    pushState.value = 'on';
    pushMsg.value = "Reminders are on. You'll be notified when a payment is verified.";
  } catch (e) {
    pushState.value = 'error';
    pushMsg.value = e?.message || 'Could not turn on reminders.';
  }
}
onMounted(async () => { await load(); if (await isPushSubscribed()) pushState.value = 'on'; });
</script>

<template>
  <div class="text-[#241b33]">
    <p class="mb-4 text-lg text-slate-600">View each child's fees and grades.</p>
    <p v-if="lrnMsg" class="mb-3 rounded-xl bg-[#dcfce7] px-5 py-3 font-semibold text-[#15803d]">{{ lrnMsg }}</p>

    <!-- Paalala / notifications -->
    <div class="mb-6 rounded-xl bg-[#f5f3ff] p-4">
      <div v-if="pushState === 'on'" class="flex items-center gap-2 font-semibold text-[#15803d]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path d="M20 6 9 17l-5-5" /></svg>
        Reminders are on for this device.
      </div>
      <template v-else>
        <button class="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#4c1d95] px-5 text-lg font-semibold text-white hover:bg-[#3b1580]" @click="turnOnPush">Turn on phone reminders</button>
        <p v-if="pushMsg" class="mt-2 text-base" :class="pushState === 'error' ? 'text-[#b91c1c]' : 'text-[#15803d]'">{{ pushMsg }}</p>
      </template>
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-4 text-lg font-semibold text-[#b91c1c]">{{ error }}</p>
    <p v-if="loading" class="py-10 text-center text-xl text-slate-600">Loading&hellip;</p>

    <div v-else-if="!children.length" class="rounded-2xl border-2 border-dashed border-[#c4b5fd] bg-white py-16 text-center">
      <p class="text-2xl font-bold text-[#5b21b6]">No linked children.</p>
      <p class="mt-2 text-lg text-slate-600">Contact the school to link your account.</p>
    </div>

    <div v-else class="space-y-6">
      <section v-for="c in children" :key="c.student._id" class="overflow-hidden rounded-2xl border border-[#e5e0f7] bg-white">
        <div class="p-5 sm:p-6">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4">
            <h2 class="text-2xl font-bold">{{ c.student.surname }}, {{ c.student.givenName }}</h2>
            <span class="text-lg text-slate-500">{{ prettyLevel(c.student.gradeLevel) }}</span>
          </div>
          <div v-if="!c.student.lrn" class="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-[#fef9e7] p-2">
            <span class="text-sm font-semibold text-[#7c5b0a]">Add LRN (if known):</span>
            <input v-model="lrnInputs[c.student._id]" placeholder="LRN" class="rounded border border-slate-300 p-1 text-sm tabular-nums" />
            <button class="rounded bg-[#6d28d9] px-3 py-1 text-sm font-bold text-white" @click="saveLrn(c)">Save</button>
          </div>
          <p v-else class="mt-1 text-sm text-slate-400">LRN: {{ c.student.lrn }}</p>

          <div class="mt-3 rounded-xl bg-[#f5f3ff] p-5">
            <p class="text-base font-semibold text-[#5b21b6]">Remaining balance</p>
            <p class="mt-1 text-4xl font-bold tabular-nums sm:text-5xl"
               :class="(c.totals?.balance ?? 0) > 0 ? 'text-[#b91c1c]' : 'text-[#15803d]'">
              {{ (c.totals?.balance ?? 0) > 0 ? peso(c.totals.balance) : 'Fully paid' }}
            </p>
            <p v-if="c.totals" class="mt-1 text-lg text-slate-600">
              Fees: {{ peso(c.totals.due) }} &middot; Paid: {{ peso(c.totals.paid) }}
            </p>
          </div>

          <ul class="mt-4 space-y-2">
            <li v-for="p in c.periods" :key="p.code" class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#efeafc] px-4 py-3">
              <div>
                <span class="text-lg font-semibold">{{ p.label }}</span>
                <span class="ml-2 tabular-nums" :class="p.balance > 0 ? 'text-[#b91c1c]' : 'text-[#15803d]'">
                  {{ p.balance > 0 ? peso(p.balance) + ' short' : 'paid' }}
                </span>
              </div>
              <span v-if="p.gatesGrades" class="rounded-lg px-3 py-1 text-base font-semibold"
                    :class="p.unlocked ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#b91c1c]'">
                {{ p.unlocked ? 'Grades: open' : 'Grades: locked' }}
              </span>
            </li>
            <li v-if="c.others?.balance > 0" class="flex items-center justify-between rounded-lg border border-[#efeafc] px-4 py-3">
              <span class="text-lg font-semibold">Other fees (books, uniform, etc.)</span>
              <span class="tabular-nums text-[#b91c1c]">{{ peso(c.others.balance) }} short</span>
            </li>
          </ul>

          <div class="mt-5 flex flex-col gap-3 sm:flex-row">
            <router-link to="/portal/pay"
              class="inline-flex min-h-[56px] flex-1 items-center justify-center rounded-xl bg-[#6d28d9] px-6 text-xl font-bold text-white hover:bg-[#5b21b6]">
              Pay
            </router-link>
            <router-link :to="`/portal/grades/${c.student._id}`"
              class="inline-flex min-h-[56px] items-center justify-center rounded-xl border-2 border-[#6d28d9] px-6 text-xl font-bold text-[#5b21b6] hover:bg-[#5b21b6] hover:text-white sm:flex-none">
              View grades
            </router-link>
          </div>
        </div>
      </section>

      <section v-if="previous.length" class="rounded-2xl border border-[#e5e0f7] bg-white p-5">
        <h2 class="mb-2 text-xl font-bold text-[#5b21b6]">Previous School Years</h2>
        <ul class="space-y-2">
          <li v-for="p in previous" :key="p._id" class="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1eefb] pb-2">
            <div>
              <span class="font-semibold">{{ p.name }}</span>
              <span class="ml-2 text-slate-500">{{ p.schoolYear }} · {{ prettyLevel(p.gradeLevel) }}</span>
              <span v-if="p.balance > 0" class="ml-2 rounded bg-[#fef3c7] px-2 py-0.5 text-sm font-semibold text-[#b45309]">Balance: {{ peso(p.balance) }}</span>
              <span v-else class="ml-2 rounded bg-[#dcfce7] px-2 py-0.5 text-sm font-semibold text-[#15803d]">Fully paid</span>
            </div>
            <router-link :to="'/portal/ledger/' + p._id" class="rounded-lg border border-[#4c1d95] px-3 py-1.5 text-sm font-semibold text-[#4c1d95]">View ledger</router-link>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
