<script setup>
import { ref, computed, onMounted } from 'vue';
import http from '@/api/http';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const canEdit = computed(() => ['ADMIN', 'SUPERADMIN'].includes(auth.role));

const CATEGORIES = ['TUITION', 'BOOKS', 'BUS', 'PE_UNIFORM', 'SCHOOL_ID', 'GRADUATION', 'APPLICATION', 'MISC'];
const GRADE_LABEL = { NURSERY: 'Nursery', KINDER_1: 'Kinder 1', KINDER_2: 'Kinder 2', GRADE_1: 'Grade 1', GRADE_2: 'Grade 2', GRADE_3: 'Grade 3', GRADE_4: 'Grade 4', GRADE_5: 'Grade 5', GRADE_6: 'Grade 6' };
const gLabel = (g) => GRADE_LABEL[g] || g;
const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;

const schedules = ref([]);
const periodOpts = ref([]);            // {code,label} active terms
const deadlines = ref([]);             // {code,label,input} admin-only
const gradeLevel = ref('');
const loading = ref(false); const savingFees = ref(false); const savingDl = ref(false);
const error = ref(''); const msg = ref('');
const showHistory = ref(false); const historyRows = ref([]);

const current = computed(() => schedules.value.find((s) => s.gradeLevel === gradeLevel.value));
const total = computed(() => (current.value?.lines || []).reduce((s, l) => s + Number(l.amount || 0), 0));
const periodLabel = (code) => (code ? (periodOpts.value.find((p) => p.code === code)?.label || code.replace('_', ' ')) : 'One-time');
const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

async function load() {
  loading.value = true; error.value = '';
  try {
    const [fees, info] = await Promise.all([http.get('/fees'), http.get('/school/info')]);
    schedules.value = fees.data;
    periodOpts.value = info.data.periods || [];
    if (schedules.value.length && !gradeLevel.value) gradeLevel.value = schedules.value[0].gradeLevel;
    if (canEdit.value) {
      const dl = (await http.get('/school/periods')).data;
      deadlines.value = dl.map((p) => ({ code: p.code, label: p.label, input: toInput(p.dueDate) }));
    }
  } catch { error.value = 'Could not load fees.'; }
  finally { loading.value = false; }
}
onMounted(load);

async function saveFees() {
  if (!current.value) return;
  savingFees.value = true; msg.value = ''; error.value = '';
  try {
    const lines = current.value.lines.map((l) => ({ label: l.label, category: l.category, period: l.period || null, amount: Number(l.amount), isObligatory: !!l.isObligatory }));
    const { data } = await http.put(`/fees/${gradeLevel.value}`, { lines });
    const idx = schedules.value.findIndex((s) => s.gradeLevel === gradeLevel.value);
    if (idx >= 0) schedules.value[idx] = data;
    msg.value = 'Fees saved.';
  } catch { error.value = 'Could not save fees.'; }
  finally { savingFees.value = false; }
}
async function saveDeadlines() {
  savingDl.value = true; msg.value = ''; error.value = '';
  try {
    const dueDates = {};
    deadlines.value.forEach((d) => { dueDates[d.code] = d.input || null; });
    await http.put('/school/periods/duedates', { dueDates });
    msg.value = 'Deadlines saved.';
  } catch { error.value = 'Could not save deadlines.'; }
  finally { savingDl.value = false; }
}
const addLine = () => current.value.lines.push({ label: '', category: 'BOOKS', period: null, amount: 0, isObligatory: false });
const removeLine = (i) => current.value.lines.splice(i, 1);

async function openHistory() {
  try { historyRows.value = (await http.get(`/fees/${gradeLevel.value}/history`)).data; showHistory.value = true; }
  catch { error.value = 'Could not load history.'; }
}
const fmtVal = (v) => (typeof v === 'boolean' ? (v ? 'yes' : 'no') : (v == null ? '—' : v));
</script>

<template>
  <div class="text-[#241b33]">
    <p class="mb-4 text-lg text-slate-600">Fees per grade and term deadlines.<span v-if="!canEdit"> Contact the school for questions.</span></p>
    <p v-if="msg" class="mb-3 rounded-xl bg-[#dcfce7] px-5 py-3 font-semibold text-[#15803d]">{{ msg }}</p>
    <p v-if="error" class="mb-3 rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>
    <p v-if="loading" class="py-10 text-center text-xl text-slate-600">Loading&hellip;</p>

    <div v-else class="space-y-6">
      <!-- Deadlines (admin only) -->
      <section v-if="canEdit && deadlines.length" class="rounded-2xl border border-[#e5e0f7] bg-white p-5">
        <h2 class="mb-2 text-xl font-bold text-[#5b21b6]">Term Due Dates</h2>
        <p class="mb-3 text-slate-600">Reminders are sent 5 days before and on the due date.</p>
        <div class="space-y-2">
          <label v-for="d in deadlines" :key="d.code" class="flex items-center justify-between gap-4">
            <span class="text-lg font-semibold">{{ d.label }}</span>
            <input v-model="d.input" type="date" class="rounded-lg border border-slate-300 p-2 text-lg" />
          </label>
        </div>
        <button class="mt-3 rounded-xl bg-[#6d28d9] px-5 py-2.5 font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="savingDl" @click="saveDeadlines">{{ savingDl ? 'Saving…' : 'Save deadlines' }}</button>
      </section>

      <!-- Grade tabs -->
      <div class="flex flex-wrap gap-2">
        <button v-for="s in schedules" :key="s.gradeLevel" class="rounded-lg border-2 px-3 py-1.5 text-sm font-semibold"
          :class="gradeLevel === s.gradeLevel ? 'border-[#6d28d9] bg-[#6d28d9] text-white' : 'border-slate-300 text-slate-700'"
          @click="gradeLevel = s.gradeLevel">{{ gLabel(s.gradeLevel) }}</button>
      </div>

      <section v-if="current" class="overflow-hidden rounded-2xl border border-[#e5e0f7] bg-white">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left">
            <thead class="bg-[#f5f3ff] text-[#4c1d95]">
              <tr><th class="p-2">Fee</th><th class="p-2">Category</th><th class="p-2">When</th><th class="p-2 text-right">Amount</th><th class="p-2 text-center">Oblig.</th><th v-if="canEdit"></th></tr>
            </thead>
            <tbody>
              <tr v-for="(l, i) in current.lines" :key="i" class="border-t border-[#f1eefb]">
                <td class="p-2">
                  <input v-if="canEdit" v-model="l.label" class="w-full rounded border border-slate-300 p-1" />
                  <span v-else>{{ l.label }}</span>
                </td>
                <td class="p-2">
                  <select v-if="canEdit" v-model="l.category" class="rounded border border-slate-300 p-1 text-sm">
                    <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <span v-else class="text-sm text-slate-500">{{ l.category }}</span>
                </td>
                <td class="p-2">
                  <select v-if="canEdit" v-model="l.period" class="rounded border border-slate-300 p-1 text-sm">
                    <option :value="null">One-time</option>
                    <option v-for="p in periodOpts" :key="p.code" :value="p.code">{{ p.label }}</option>
                  </select>
                  <span v-else class="text-sm text-slate-600">{{ periodLabel(l.period) }}</span>
                </td>
                <td class="p-2 text-right">
                  <input v-if="canEdit" v-model.number="l.amount" type="number" class="w-24 rounded border border-slate-300 p-1 text-right tabular-nums" />
                  <span v-else class="tabular-nums">{{ peso(l.amount) }}</span>
                </td>
                <td class="p-2 text-center">
                  <input v-if="canEdit" type="checkbox" v-model="l.isObligatory" />
                  <span v-else>{{ l.isObligatory ? '\u2713' : '' }}</span>
                </td>
                <td v-if="canEdit" class="p-2 text-center"><button class="rounded border border-slate-300 px-2 text-slate-500" @click="removeLine(i)">✕</button></td>
              </tr>
              <tr class="border-t-2 border-[#e5e0f7] bg-[#faf9fc]">
                <td class="p-2 font-bold" :colspan="3">Total (all fees)</td>
                <td class="p-2 text-right font-bold tabular-nums">{{ peso(total) }}</td>
                <td :colspan="canEdit ? 2 : 1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p class="text-sm text-slate-500">Obligatory fees must be paid before the enrollment terms. Terms are paid in order (Term 1 &rarr; Term 2 &rarr; Term 3); Graduation only after all terms.</p>

      <div v-if="canEdit" class="flex flex-wrap gap-2">
        <button class="rounded-xl border-2 border-[#4c1d95] px-4 py-2 font-semibold text-[#4c1d95] hover:bg-[#f5f3ff]" @click="addLine">+ Add fee</button>
        <button class="rounded-xl bg-[#6d28d9] px-5 py-2.5 font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="savingFees" @click="saveFees">{{ savingFees ? 'Saving…' : 'Save fees' }}</button>
        <button class="rounded-xl border-2 border-slate-400 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100" @click="openHistory">Change history</button>
      </div>
    </div>

    <!-- History modal -->
    <div v-if="showHistory" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showHistory = false">
      <div class="max-h-[80vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-xl font-bold text-[#5b21b6]">Change history — {{ gLabel(gradeLevel) }}</h2>
          <button class="rounded-lg bg-slate-100 px-3 py-1 font-bold" @click="showHistory = false">Close</button>
        </div>
        <p v-if="!historyRows.length" class="text-slate-500">No changes recorded.</p>
        <ul v-else class="space-y-2">
          <li v-for="h in historyRows" :key="h._id" class="border-b border-[#f1eefb] pb-2 text-sm">
            <b>{{ h.label }}</b> — {{ h.field }}: <span class="text-[#b91c1c]">{{ fmtVal(h.oldValue) }}</span> &rarr; <span class="text-[#15803d]">{{ fmtVal(h.newValue) }}</span>
            <span class="block text-slate-400">by {{ h.changedByName }} · {{ new Date(h.createdAt).toLocaleString('en-PH') }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
