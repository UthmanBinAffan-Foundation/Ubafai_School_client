<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import http from '@/api/http';
import { useSchoolYearStore } from '@/stores/schoolYear';

const router = useRouter();
const sy = useSchoolYearStore();
const rows = ref([]); const loading = ref(false); const error = ref('');
const q = ref(''); const grade = ref('');
const sectionFilter = ref('');

const GRADES = [['', 'All grades'], ['NURSERY', 'Nursery'], ['KINDER_1', 'Kinder 1'], ['KINDER_2', 'Kinder 2'],
  ['GRADE_1', 'Grade 1'], ['GRADE_2', 'Grade 2'], ['GRADE_3', 'Grade 3'], ['GRADE_4', 'Grade 4'], ['GRADE_5', 'Grade 5'], ['GRADE_6', 'Grade 6']];
const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;
const prettyLevel = (g) => (g || '').replace('_', ' ');

async function load() {
  loading.value = true; error.value = '';
  try { rows.value = (await http.get('/students' + (sy.selected ? `?schoolYear=${sy.selected}` : ''))).data; }
  catch { error.value = 'Could not load the list.'; }
  finally { loading.value = false; }
}
onMounted(load);
watch(() => sy.selected, load);

const filtered = computed(() => rows.value.filter((s) => {
  const okG = !grade.value || s.gradeLevel === grade.value;
  const okS = !sectionFilter.value || (s.section || '').toUpperCase() === sectionFilter.value.trim().toUpperCase();
  const term = q.value.trim().toLowerCase();
  const okQ = !term || `${s.surname} ${s.givenName} ${s.lrn || ''}`.toLowerCase().includes(term);
  return okG && okS && okQ;
}));
const openStudent = (id) => router.push(`/admin/student/${id}`);
</script>

<template>
  <div class="text-[#241b33]">
    <div class="mb-4 flex flex-col gap-3 sm:flex-row">
      <input v-model="q" placeholder="Search (name or LRN)" class="flex-1 rounded-lg border border-slate-300 p-3 text-lg" />
      <select v-model="grade" class="rounded-lg border border-slate-300 p-3 text-lg sm:w-52">
        <option v-for="[val, lbl] in GRADES" :key="val" :value="val">{{ lbl }}</option>
      </select>
      <input v-model="sectionFilter" maxlength="2" placeholder="Section" class="rounded-lg border border-slate-300 p-3 text-lg uppercase sm:w-28" />
    </div>

    <p v-if="error" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-4 text-lg font-semibold text-[#b91c1c]">{{ error }}</p>
    <p v-if="loading" class="py-10 text-center text-xl text-slate-600">Loading&hellip;</p>

    <div v-else-if="!filtered.length" class="rounded-2xl border-2 border-dashed border-[#c4b5fd] bg-white py-16 text-center">
      <p class="text-xl font-bold text-[#5b21b6]">No matching students.</p>
    </div>

    <div v-else class="overflow-hidden rounded-2xl border border-[#e5e0f7] bg-white">
      <table class="w-full text-left">
        <thead class="bg-[#f5f3ff] text-[#4c1d95]">
          <tr><th class="p-4 text-lg">Name</th><th class="p-4 text-lg">Grade</th><th class="hidden p-4 text-lg sm:table-cell">LRN</th><th class="p-4 text-right text-lg">Balance</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in filtered" :key="s._id" class="cursor-pointer border-t border-[#f1eefb] hover:bg-[#f5f3ff]" @click="openStudent(s._id)">
            <td class="p-4 text-lg font-semibold">{{ s.surname }}, {{ s.givenName }}
              <span class="ml-1 rounded px-1.5 py-0.5 text-xs font-semibold" :class="s.returning ? 'bg-[#dbeafe] text-[#1e40af]' : 'bg-[#dcfce7] text-[#15803d]'">{{ s.returning ? 'Returning' : 'New' }}</span></td>
            <td class="p-4 text-lg">{{ prettyLevel(s.gradeLevel) }}{{ s.section }}</td>
            <td class="hidden p-4 tabular-nums text-slate-600 sm:table-cell">{{ s.lrn || '\u2014' }}</td>
            <td class="p-4 text-right text-lg font-bold">
              <span v-if="(s.totals?.balance ?? 0) > 0" class="text-[#b91c1c]">{{ peso(s.totals.balance) }}</span>
              <span v-else class="text-[#15803d]">Paid</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mt-3 text-slate-500">Tap a student to view the ledger and history.</p>
  </div>
</template>
