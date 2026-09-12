<script setup>
import { ref, computed, onMounted } from 'vue';
import http from '@/api/http';

const assignments = ref([]);
const teacherName = ref('');
const gradeLevel = ref('');
const sheet = ref({ subjects: [], terms: [], students: [] });
const loading = ref(false); const error = ref(''); const msg = ref('');
const editId = ref(''); const editGrades = ref({}); const saving = ref(false);

const GRADE_LABEL = { NURSERY: 'Nursery', KINDER_1: 'Kinder 1', KINDER_2: 'Kinder 2', GRADE_1: 'Grade 1', GRADE_2: 'Grade 2', GRADE_3: 'Grade 3', GRADE_4: 'Grade 4', GRADE_5: 'Grade 5', GRADE_6: 'Grade 6' };
const gLabel = (g) => GRADE_LABEL[g] || g;
const myGrades = computed(() => [...new Set(assignments.value.map((a) => a.gradeLevel))]);

async function loadBootstrap() {
  try {
    const { data } = await http.get('/teacher/bootstrap');
    assignments.value = data.profile.assignments; teacherName.value = data.profile.name;
    if (myGrades.value.length) { gradeLevel.value = myGrades.value[0]; await loadSheet(); }
  } catch (e) { error.value = e?.response?.data?.message || 'Could not load.'; }
}
onMounted(loadBootstrap);

async function loadSheet() {
  if (!gradeLevel.value) return;
  loading.value = true; editId.value = '';
  try { sheet.value = (await http.get(`/teacher/gradesheet?gradeLevel=${gradeLevel.value}`)).data; }
  catch { error.value = 'Could not load grades.'; }
  finally { loading.value = false; }
}

function startEdit(row) {
  editId.value = row._id;
  const copy = {};
  sheet.value.subjects.forEach((sub) => { copy[sub] = {}; sheet.value.terms.forEach((t) => { copy[sub][t.code] = row.grades?.[sub]?.[t.code] ?? ''; }); });
  editGrades.value = copy;
}
async function saveRow(row) {
  saving.value = true; msg.value = ''; error.value = '';
  try { await http.post('/teacher/gradesheet', { student: row._id, gradeLevel: gradeLevel.value, grades: editGrades.value }); editId.value = ''; msg.value = 'Grades saved.'; await loadSheet(); }
  catch { error.value = 'Could not save.'; } finally { saving.value = false; }
}
async function delRow(row) {
  if (!confirm(`Clear your subjects' grades for ${row.name}?`)) return;
  try { await http.delete(`/teacher/gradesheet?student=${row._id}&gradeLevel=${gradeLevel.value}`); await loadSheet(); }
  catch { error.value = 'Could not delete.'; }
}
</script>

<template>
  <div class="text-[#241b33]">
    <p class="mb-3 text-lg text-slate-600">{{ teacherName }} — enter grades for your students.</p>
    <p v-if="msg" class="mb-3 rounded-xl bg-[#dcfce7] px-5 py-3 font-semibold text-[#15803d]">{{ msg }}</p>
    <p v-if="error" class="mb-3 rounded-xl bg-[#fee2e2] px-5 py-3 font-semibold text-[#b91c1c]">{{ error }}</p>

    <label class="mb-4 block max-w-xs"><span class="font-semibold">Grade level</span>
      <select v-model="gradeLevel" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg" @change="loadSheet">
        <option v-for="g in myGrades" :key="g" :value="g">{{ gLabel(g) }}</option>
      </select>
    </label>

    <p v-if="loading" class="py-8 text-center text-slate-600">Loading…</p>
    <p v-else-if="!sheet.students.length" class="rounded-2xl border-2 border-dashed border-[#c4b5fd] bg-white py-12 text-center text-[#5b21b6]">No students in this grade.</p>

    <div v-else class="overflow-x-auto rounded-2xl border border-[#e5e0f7] bg-white">
      <table class="w-full text-left text-sm">
        <thead class="bg-[#f5f3ff] text-[#4c1d95]">
          <tr>
            <th class="p-2" rowspan="2">Name</th><th class="p-2" rowspan="2">LRN</th>
            <th class="p-2 text-center" v-for="sub in sheet.subjects" :key="sub" :colspan="sheet.terms.length">{{ sub }}</th>
            <th class="p-2 text-right" rowspan="2">Avg</th><th class="p-2" rowspan="2">Actions</th>
          </tr>
          <tr>
            <template v-for="sub in sheet.subjects"><th class="p-1 text-center text-xs font-medium" v-for="t in sheet.terms" :key="sub + t.code">{{ t.label }}</th></template>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in sheet.students" :key="row._id" class="border-t border-[#f1eefb]" :class="editId === row._id ? 'bg-[#f5f3ff]' : ''">
            <td class="p-2 font-semibold">{{ row.name }}</td>
            <td class="p-2 tabular-nums text-slate-600">{{ row.lrn || '—' }}</td>
            <template v-for="sub in sheet.subjects">
              <td v-for="t in sheet.terms" :key="row._id + sub + t.code" class="p-1 text-center">
                <input v-if="editId === row._id" v-model="editGrades[sub][t.code]" type="number" class="w-14 rounded border border-slate-300 p-1 text-center tabular-nums" />
                <span v-else class="tabular-nums">{{ row.grades?.[sub]?.[t.code] ?? '—' }}</span>
              </td>
            </template>
            <td class="p-2 text-right font-bold tabular-nums">{{ row.average ?? '—' }}</td>
            <td class="p-2">
              <div v-if="editId === row._id" class="flex gap-1">
                <button class="rounded bg-[#6d28d9] px-2 py-1 text-xs font-bold text-white" :disabled="saving" @click="saveRow(row)">Save</button>
                <button class="rounded border border-slate-300 px-2 py-1 text-xs" @click="editId = ''">Cancel</button>
              </div>
              <div v-else class="flex gap-1">
                <button class="rounded border border-[#4c1d95] px-2 py-1 text-xs font-semibold text-[#4c1d95]" @click="startEdit(row)">Edit</button>
                <button class="rounded border border-[#b91c1c] px-2 py-1 text-xs font-semibold text-[#b91c1c]" @click="delRow(row)">Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
