<script setup>
import { ref, onMounted } from 'vue';
import http from '@/api/http';
import { useSchoolYearStore } from '@/stores/schoolYear';
const syStore = useSchoolYearStore();
const newYear = ref('');
async function addYear(){ if(!newYear.value.trim())return; await syStore.createYear(newYear.value.trim()); newYear.value=''; }
async function activateYear(id){ const y = syStore.years.find((x) => x._id === id); if (!confirm(`Set "${y?.label}" as the CURRENT school year? All new enrollments, payments, and grades will go to this year, and parents will see this year. Continue?`)) return; await syStore.activate(id); }

const gating = ref({ mode: 'FULL', value: 100 });
const methods = ref({ onlineMode: 'MANUAL', overTheCounter: true });
const paymongo = ref({ feePercent: 2.5, feeFixed: 0 });
const accounts = ref([]);
const msg = ref(''); const error = ref('');
const busy = ref('');

async function load() {
  try {
    const { data } = await http.get('/school/info');
    gating.value = data.gating || gating.value;
    methods.value = { onlineMode: 'MANUAL', overTheCounter: true, ...data.paymentMethods };
    paymongo.value = data.paymongo || paymongo.value;
    accounts.value = (data.payoutAccounts || []).map((a) => ({ ...a }));
  } catch { error.value = 'Could not load settings.'; }
}
onMounted(async () => { await load(); await syStore.load(); });

async function save(section) {
  busy.value = section; msg.value = ''; error.value = '';
  try {
    if (section === 'gating') await http.put('/school/gating', gating.value);
    if (section === 'methods') await http.put('/school/payment-methods', { methods: methods.value, paymongo: paymongo.value });
    if (section === 'accounts') await http.put('/school/payout-accounts', { accounts: accounts.value });
    msg.value = 'Saved.';
  } catch { error.value = 'Could not save.'; }
  finally { busy.value = ''; }
}
const addAccount = () => accounts.value.push({ method: 'GCASH', label: '', number: '' });
const removeAccount = (i) => accounts.value.splice(i, 1);
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6 text-[#241b33]">
    <p v-if="msg" class="rounded-xl bg-[#dcfce7] px-5 py-3 font-semibold text-[#15803d]">{{ msg }}</p>
    <p v-if="error" class="rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>

    <!-- School Years -->
    <section class="space-y-3 rounded-2xl border border-[#e5e0f7] bg-white p-5">
      <h2 class="text-xl font-bold text-[#5b21b6]">School Years</h2>
      <p class="text-slate-600">The current school year is used for new enrollments, payments, and grades.</p>
      <ul class="space-y-2">
        <li v-for="y in syStore.years" :key="y._id" class="flex items-center justify-between rounded-lg border border-[#eef0f6] px-4 py-2">
          <span class="text-lg font-semibold">{{ y.label }} <span v-if="y.isActive" class="ml-2 rounded bg-[#dcfce7] px-2 py-0.5 text-sm text-[#15803d]">current</span></span>
          <button v-if="!y.isActive" class="rounded-lg border-2 border-[#4c1d95] px-3 py-1.5 text-sm font-semibold text-[#4c1d95] hover:bg-[#f5f3ff]" @click="activateYear(y._id)">Set as current</button>
        </li>
      </ul>
      <div class="flex gap-2">
        <input v-model="newYear" placeholder="e.g. 2027-2028" class="flex-1 rounded-lg border border-slate-300 p-2" />
        <button class="rounded-xl bg-[#6d28d9] px-4 py-2 font-bold text-white hover:bg-[#5b21b6]" @click="addYear">Add year</button>
      </div>
      <p class="text-sm text-slate-500">New years copy the current term structure. Set fees for the new year on the Fees page after activating.</p>
    </section>

    <!-- Payment Methods — HIDDEN per owner (default: Manual GCash/Bank + Over-the-Counter). Remove v-if="false" to restore. -->
    <section v-if="false" class="space-y-3 rounded-2xl border border-[#e5e0f7] bg-white p-5">
      <h2 class="text-xl font-bold text-[#5b21b6]">Payment Methods</h2>
      <p class="text-slate-600">Pick <b>one</b> online method. Over-the-Counter can be enabled alongside it.</p>

      <p class="font-semibold">Online payment method</p>
      <label class="flex items-start gap-3"><input type="radio" value="NONE" v-model="methods.onlineMode" class="mt-1.5" />
        <span><b>None</b> — no online payment (parents pay over-the-counter only).</span></label>
      <label class="flex items-start gap-3"><input type="radio" value="MANUAL" v-model="methods.onlineMode" class="mt-1.5" />
        <span><b>Manual (GCash / LandBank)</b> — parents send to your accounts and enter the reference; you approve. No extra charge.</span></label>
      <label class="flex items-start gap-3"><input type="radio" value="PAYMONGO" v-model="methods.onlineMode" class="mt-1.5" />
        <span><b>PayMongo</b> — automatic online payment; a convenience fee is added and paid by the parent.</span></label>

      <p v-if="methods.onlineMode === 'PAYMONGO'" class="rounded-lg bg-[#fef9e7] px-4 py-2 text-sm text-[#7c5b0a]">
        Requires a PayMongo account and API keys in the server .env. The fee below is added to and paid by the parent.
      </p>
      <div v-if="methods.onlineMode === 'PAYMONGO'" class="flex gap-3">
        <label class="block"><span class="text-sm font-semibold">Fee %</span>
          <input v-model.number="paymongo.feePercent" type="number" step="0.1" class="mt-1 w-28 rounded-lg border border-slate-300 p-2 tabular-nums" /></label>
        <label class="block"><span class="text-sm font-semibold">Fixed (PHP)</span>
          <input v-model.number="paymongo.feeFixed" type="number" class="mt-1 w-28 rounded-lg border border-slate-300 p-2 tabular-nums" /></label>
      </div>

      <label class="mt-2 flex items-center gap-3 text-lg"><input type="checkbox" v-model="methods.overTheCounter" /> Over-the-Counter <span class="text-sm text-slate-500">(pay at school, no charge)</span></label>

      <button class="rounded-xl bg-[#6d28d9] px-5 py-2.5 font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="busy==='methods'" @click="save('methods')">Save payment methods</button>
    </section>

    <!-- Payout Accounts -->
    <section class="space-y-3 rounded-2xl border border-[#e5e0f7] bg-white p-5">
      <h2 class="text-xl font-bold text-[#5b21b6]">Payout Accounts</h2>
      <p class="text-slate-600">Where parents send manual payments (shown on their payment form).</p>
      <div v-for="(a, i) in accounts" :key="i" class="space-y-2 rounded-xl border border-[#eef0f6] bg-[#faf9fc] p-3">
        <div class="flex items-center gap-2">
          <select v-model="a.method" class="min-w-0 flex-1 rounded-lg border border-slate-300 p-2">
            <option value="GCASH">GCash</option><option value="LANDBANK">LandBank</option><option value="BANK">Other bank</option>
          </select>
          <button class="shrink-0 rounded-lg border-2 border-slate-300 px-3 py-2 text-slate-600" @click="removeAccount(i)">Remove</button>
        </div>
        <input v-model="a.label" placeholder="Label (e.g. GCash - Juan)" class="w-full rounded-lg border border-slate-300 p-2" />
        <input v-model="a.number" placeholder="Number" class="w-full rounded-lg border border-slate-300 p-2 tabular-nums" />
      </div>
      <button class="text-lg font-semibold text-[#4c1d95] underline" @click="addAccount">+ Add account</button>
      <div><button class="rounded-xl bg-[#6d28d9] px-5 py-2.5 font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="busy==='accounts'" @click="save('accounts')">Save accounts</button></div>
    </section>

    <!-- Gating -->
    <section class="space-y-3 rounded-2xl border border-[#e5e0f7] bg-white p-5">
      <h2 class="text-xl font-bold text-[#5b21b6]">Grade Unlocking (gating)</h2>
      <p class="text-slate-600">When to unlock a student's grades based on their term payment.</p>
      <label class="flex items-start gap-3"><input type="radio" value="FULL" v-model="gating.mode" class="mt-1.5" /><span><b>Full payment</b> — grades open only when the term tuition is fully paid.</span></label>
      <label class="flex items-start gap-3"><input type="radio" value="PERCENT" v-model="gating.mode" class="mt-1.5" /><span><b>Percentage</b> — opens when a set % of the term tuition is reached.</span></label>
      <label class="flex items-start gap-3"><input type="radio" value="FIXED" v-model="gating.mode" class="mt-1.5" /><span><b>Fixed amount</b> — opens when a fixed downpayment is reached.</span></label>
      <label v-if="gating.mode !== 'FULL'" class="block"><span class="font-semibold">{{ gating.mode === 'PERCENT' ? 'Percentage (0-100)' : 'Amount (PHP)' }}</span>
        <input v-model.number="gating.value" type="number" class="mt-1 w-40 rounded-lg border border-slate-300 p-3 text-lg tabular-nums" /></label>
      <button class="rounded-xl bg-[#6d28d9] px-5 py-2.5 font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="busy==='gating'" @click="save('gating')">Save gating</button>
    </section>
  </div>
</template>
