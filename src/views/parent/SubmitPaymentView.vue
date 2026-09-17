<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import http from '@/api/http';
import { useToast } from '@/toast';

const route = useRoute();
const children = ref([]);
const toast = useToast();
const school = ref({ paymentMethods: {}, paymongo: { feePercent: 0, feeFixed: 0 }, payoutAccounts: [] });
const items = ref([]);
const selected = ref({});
const amount = ref(null);
const choice = ref('');
const form = ref({ student: '', referenceNo: '', account: '' });
const submitting = ref(false); const done = ref(false); const error = ref('');
const cancelled = ref(route.query.cancelled === '1');

const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;
const statusText = (s) => (s === 'PAID' ? 'Paid' : s === 'PARTIAL' ? 'Partially Paid' : 'Not Paid');

onMounted(async () => {
  try {
    const [kids, info] = await Promise.all([http.get('/students/mine'), http.get('/school/info')]);
    children.value = kids.data; school.value = info.data;
    const accts = school.value.payoutAccounts || [];
    if (accts.length) form.value.account = accts[0].number;
    if (children.value.length === 1) form.value.student = children.value[0].student._id;
    const opts = options.value; if (opts.length) choice.value = opts[0].key;
  } catch { error.value = 'Could not load data. Refresh the page.'; }
});

async function loadLedger(id) {
  items.value = []; selected.value = {}; amount.value = null;
  if (!id) return;
  try { items.value = (await http.get(`/students/${id}/ledger-items`)).data.items; } catch { /* ignore */ }
}
watch(() => form.value.student, (id) => loadLedger(id));

function toggle(key) {
  selected.value[key] = !selected.value[key];
  amount.value = items.value.filter((i) => selected.value[i.key]).reduce((s, i) => s + i.balance, 0) || null;
}
const selectedKeys = computed(() => Object.keys(selected.value).filter((k) => selected.value[k]));

const onlineMode = computed(() => school.value.paymentMethods?.onlineMode || 'NONE');
const otcOn = computed(() => !!school.value.paymentMethods?.overTheCounter);
const options = computed(() => {
  const list = [];
  if (onlineMode.value === 'MANUAL') list.push({ key: 'ONLINE', label: 'Online payment', note: 'no extra charge' });
  else if (onlineMode.value === 'PAYMONGO') list.push({ key: 'ONLINE', label: 'Online payment', note: 'small fee added' });
  if (otcOn.value) list.push({ key: 'OTC', label: 'Over-the-Counter', note: 'pay at school, no charge' });
  return list;
});
const accounts = computed(() => school.value.payoutAccounts || []);
const fee = computed(() => { const b = Number(amount.value) || 0; const p = school.value.paymongo || {}; return Math.round((b * (p.feePercent || 0)) / 100 + (p.feeFixed || 0)); });
const gross = computed(() => (Number(amount.value) || 0) + fee.value);

async function submitManual() {
  error.value = '';
  if (!form.value.student || !selectedKeys.value.length || !amount.value || !form.value.referenceNo) { toast.warn('Please tick fee(s), enter an amount, and the reference number.'); return; }
  submitting.value = true;
  try {
    const acct = accounts.value.find((a) => a.number === form.value.account);
    await http.post('/payments', {
      student: form.value.student,
      amount: amount.value,
      method: acct?.method || 'GCASH',
      referenceNo: form.value.referenceNo,
      payKeys: selectedKeys.value,
    });
    done.value = true;
  } catch (e) { error.value = e?.response?.data?.message || 'Could not send. Please try again.'; }
  finally { submitting.value = false; }
}
async function payOnline() {
  error.value = '';
  if (!form.value.student || !selectedKeys.value.length || !amount.value) { error.value = 'Select fee(s) and an amount.'; return; }
  submitting.value = true;
  try {
    const { data } = await http.post('/paymongo/checkout', { student: form.value.student, amount: amount.value, payKeys: selectedKeys.value });
    window.location.href = data.checkoutUrl;
  } catch (e) { error.value = e?.response?.data?.message || 'Online payment is not available yet.'; submitting.value = false; }
}
</script>

<template>
  <div class="mx-auto max-w-lg text-[#241b33]">
    <p class="mb-6 text-lg text-slate-600">Choose how you want to pay.</p>

    <div v-if="done" class="rounded-2xl bg-[#dcfce7] p-6 text-center">
      <p class="text-2xl font-bold text-[#15803d]">Sent!</p>
      <p class="mt-2 text-lg text-slate-700">Awaiting the admin's confirmation. You'll see the update in your balance.</p>
      <router-link to="/portal" class="mt-4 inline-block text-lg font-semibold text-[#4c1d95] underline">Back to balance</router-link>
    </div>

    <div v-else class="space-y-5">
      <p v-if="cancelled" class="rounded-xl bg-[#fef9e7] px-5 py-3 text-[#7c5b0a]">Online payment was cancelled. You can try again.</p>
      <p v-if="error" class="rounded-xl bg-[#fee2e2] px-5 py-4 text-lg font-semibold text-[#b91c1c]">{{ error }}</p>
      <p v-if="!options.length" class="rounded-xl bg-[#fef9e7] px-5 py-4 text-[#7c5b0a]">No payment methods are enabled yet. Please contact the school.</p>

      <div v-if="options.length" class="flex flex-wrap gap-2">
        <button v-for="o in options" :key="o.key" class="flex flex-col items-start rounded-xl border-2 px-4 py-2.5 text-left"
          :class="choice === o.key ? 'border-[#6d28d9] bg-[#6d28d9] text-white' : 'border-slate-300 text-slate-700'" @click="choice = o.key">
          <span class="font-semibold">{{ o.label }}</span><span class="text-sm" :class="choice === o.key ? 'text-white/80' : 'text-slate-500'">{{ o.note }}</span>
        </button>
      </div>

      <div v-if="options.length" class="space-y-4 rounded-2xl border border-[#e5e0f7] bg-white p-5">
        <label class="block"><span class="text-lg font-semibold">Which child?</span>
          <select v-model="form.student" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg">
            <option value="" disabled>Select…</option>
            <option v-for="c in children" :key="c.student._id" :value="c.student._id">{{ c.student.surname }}, {{ c.student.givenName }} ({{ (c.student.gradeLevel||'').replace('_',' ') }})</option>
          </select>
        </label>

        <!-- Fee selection (multi) -->
        <div v-if="form.student && items.length && choice !== 'OTC'">
          <span class="text-lg font-semibold">What to pay</span>
          <div class="mt-1 space-y-2">
            <label v-for="it in items" :key="it.key"
              class="flex items-center justify-between rounded-lg border px-3 py-2"
              :class="it.payable ? 'border-slate-300' : 'border-slate-200 bg-slate-50 opacity-70'">
              <span class="flex items-center gap-2">
                <input v-if="it.payable" type="checkbox" :checked="selected[it.key]" @change="toggle(it.key)" />
                <span v-else>🔒</span>
                <span>
                  <span class="font-semibold">{{ it.label }}</span>
                  <span class="ml-1 tabular-nums text-slate-600">{{ peso(it.balance) }}</span>
                  <span v-if="!it.payable && it.reason" class="block text-xs text-[#b91c1c]">{{ it.reason }}</span>
                </span>
              </span>
              <span class="text-xs font-semibold" :class="it.status==='PAID' ? 'text-[#15803d]' : it.status==='PARTIAL' ? 'text-[#b45309]' : 'text-[#b91c1c]'">{{ statusText(it.status) }}</span>
            </label>
          </div>
        </div>

        <!-- OTC info -->
        <div v-if="choice === 'OTC'" class="rounded-xl bg-[#f5f3ff] p-4 text-slate-700">
          Pay in cash at the school office. <b>No online charge.</b> The admin will record your payment and update your balance.
        </div>

        <!-- Online: MANUAL -->
        <template v-else-if="choice === 'ONLINE' && onlineMode === 'MANUAL'">
          <div v-if="accounts.length" class="rounded-xl bg-[#f5f3ff] p-4">
            <p class="text-base font-semibold text-[#4c1d95]">Send the payment to:</p>
            <ul class="mt-1 space-y-1"><li v-for="a in accounts" :key="a.number" class="text-lg"><span class="font-semibold">{{ a.label || a.method }}</span> · <span class="tabular-nums">{{ a.number }}</span></li></ul>
          </div>
          <label v-if="accounts.length > 1" class="block"><span class="text-lg font-semibold">Which account did you send to?</span>
            <select v-model="form.account" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg">
              <option v-for="a in accounts" :key="a.number" :value="a.number">{{ a.label || a.method }} · {{ a.number }}</option>
            </select>
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block"><span class="text-lg font-semibold">Amount</span>
              <input v-model.number="amount" type="number" placeholder="0" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg tabular-nums" /></label>
            <label class="block"><span class="text-lg font-semibold">Reference No.</span>
              <input v-model="form.referenceNo" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg tabular-nums" /></label>
          </div>
          <button class="inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-[#6d28d9] px-6 text-xl font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="submitting" @click="submitManual">{{ submitting ? 'Sending…' : 'Submit payment' }}</button>
        </template>

        <!-- Online: PAYMONGO -->
        <template v-else-if="choice === 'ONLINE' && onlineMode === 'PAYMONGO'">
          <label class="block"><span class="text-lg font-semibold">Amount</span>
            <input v-model.number="amount" type="number" placeholder="0" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg tabular-nums" /></label>
          <div v-if="amount" class="rounded-xl bg-[#f5f3ff] p-4 text-slate-700">
            Amount: <b>{{ peso(amount) }}</b> + convenience fee <b>{{ peso(fee) }}</b><br />You pay: <b class="text-[#4c1d95]">{{ peso(gross) }}</b>. Verified automatically after payment.
          </div>
          <button class="inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-[#6d28d9] px-6 text-xl font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="submitting" @click="payOnline">{{ submitting ? 'Redirecting…' : 'Pay online' }}</button>
        </template>

        <p v-if="choice !== 'OTC'" class="text-sm text-slate-500">Tip: obligatory fees and Term 1 must be paid before later terms.</p>
      </div>
    </div>
  </div>
</template>
