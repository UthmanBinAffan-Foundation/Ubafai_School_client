<script setup>
import { ref, onMounted } from 'vue';
import http from '@/api/http';

const periods = ref([]);
const loading = ref(false);
const saving = ref(false);
const msg = ref('');
const error = ref('');

const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

async function load() {
  loading.value = true; error.value = '';
  try {
    const data = (await http.get('/school/periods')).data;
    periods.value = data.map((p) => ({ ...p, input: toInput(p.dueDate) }));
  } catch { error.value = 'Could not load the terms.'; }
  finally { loading.value = false; }
}

async function save() {
  saving.value = true; msg.value = ''; error.value = '';
  try {
    const dueDates = {};
    periods.value.forEach((p) => { dueDates[p.code] = p.input || null; });
    await http.put('/school/periods/duedates', { dueDates });
    msg.value = 'Deadlines saved.';
  } catch { error.value = 'Could not save. Please try again.'; }
  finally { saving.value = false; }
}
onMounted(load);
</script>

<template>
  <div class="mx-auto max-w-lg text-[#241b33]">
    <p class="mb-6 text-lg text-slate-600">The system automatically reminds 5 days before and on the due date.</p>

    <p v-if="error" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-4 text-lg font-semibold text-[#b91c1c]">{{ error }}</p>
    <p v-if="msg" class="mb-4 rounded-xl bg-[#dcfce7] px-5 py-4 text-lg font-semibold text-[#15803d]">{{ msg }}</p>
    <p v-if="loading" class="py-10 text-center text-xl text-slate-600">Loading&hellip;</p>

    <div v-else class="space-y-4 rounded-2xl border border-[#e5e0f7] bg-white p-5">
      <label v-for="p in periods" :key="p.code" class="flex items-center justify-between gap-4">
        <span class="text-lg font-semibold">{{ p.label }}</span>
        <input v-model="p.input" type="date" class="rounded-lg border border-slate-300 p-3 text-lg" />
      </label>
      <button
        class="inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-[#6d28d9] px-6 text-xl font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60"
        :disabled="saving" @click="save">
        {{ saving ? 'Saving\u2026' : 'Save deadlines' }}
      </button>
    </div>
  </div>
</template>
