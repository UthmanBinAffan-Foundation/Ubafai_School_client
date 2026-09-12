<script setup>
import { ref, onMounted } from 'vue';
import http from '@/api/http';

const GRADE_LEVELS = [['NURSERY', 'Nursery'], ['KINDER_1', 'Kinder 1'], ['KINDER_2', 'Kinder 2'], ['GRADE_1', 'Grade 1'], ['GRADE_2', 'Grade 2'], ['GRADE_3', 'Grade 3'], ['GRADE_4', 'Grade 4'], ['GRADE_5', 'Grade 5'], ['GRADE_6', 'Grade 6']];
const labelOf = (v) => (GRADE_LEVELS.find(([val]) => val === v)?.[1]) || v;

const teachers = ref([]);
const name = ref('');
const assignments = ref([{ gradeLevel: '', subjectsText: '' }]);
const saving = ref(false); const busyId = ref('');
const error = ref(''); const creds = ref(null);
const editId = ref(''); const editForm = ref({ name: '', assignments: [] });

async function loadTeachers() { try { teachers.value = (await http.get('/teacher')).data; } catch { /* ok */ } }
onMounted(loadTeachers);

const addRow = () => assignments.value.push({ gradeLevel: '', subjectsText: '' });
const removeRow = (i) => assignments.value.splice(i, 1);
const toAssignments = (rows) => rows.filter((a) => a.gradeLevel).map((a) => ({ gradeLevel: a.gradeLevel, subjects: a.subjectsText.split(',').map((s) => s.trim()).filter(Boolean) }));

async function submit() {
  error.value = '';
  if (!name.value) { error.value = 'Enter the teacher name.'; return; }
  saving.value = true;
  try {
    creds.value = { name: name.value, ...(await http.post('/teacher', { name: name.value, assignments: toAssignments(assignments.value) })).data.credentials };
    name.value = ''; assignments.value = [{ gradeLevel: '', subjectsText: '' }];
    await loadTeachers();
  } catch (e) { error.value = e?.response?.data?.message || 'Could not save.'; }
  finally { saving.value = false; }
}
function startEdit(t) {
  editId.value = t._id;
  editForm.value = { name: t.name, assignments: (t.assignments || []).map((a) => ({ gradeLevel: a.gradeLevel, subjectsText: (a.subjects || []).join(', ') })) };
  if (!editForm.value.assignments.length) editForm.value.assignments = [{ gradeLevel: '', subjectsText: '' }];
}
const editAddRow = () => editForm.value.assignments.push({ gradeLevel: '', subjectsText: '' });
const editRemoveRow = (i) => editForm.value.assignments.splice(i, 1);
async function saveEdit(id) {
  busyId.value = id;
  try { await http.patch(`/teacher/${id}`, { name: editForm.value.name, assignments: toAssignments(editForm.value.assignments) }); editId.value = ''; await loadTeachers(); }
  catch { error.value = 'Could not update.'; } finally { busyId.value = ''; }
}
async function del(t) {
  if (!confirm(`Delete teacher "${t.name}" and their login? This cannot be undone.`)) return;
  busyId.value = t._id;
  try { await http.delete(`/teacher/${t._id}`); await loadTeachers(); }
  catch { error.value = 'Could not delete.'; } finally { busyId.value = ''; }
}
async function reset(t) { busyId.value = t._id; creds.value = null; try { creds.value = { name: t.name, ...(await http.post(`/teacher/${t._id}/reset-password`)).data.credentials }; } catch { error.value = 'Could not reset.'; } finally { busyId.value = ''; } }
async function toggle(t) { busyId.value = t._id; try { t.active = (await http.post(`/teacher/${t._id}/toggle-active`)).data.active; } catch { error.value = 'Could not change.'; } finally { busyId.value = ''; } }
</script>

<template>
  <div class="mx-auto max-w-2xl text-[#241b33]">
    <div v-if="creds" class="mb-4 rounded-xl border-2 border-[#4c1d95] bg-white px-5 py-4">
      <p class="font-bold text-[#4c1d95]">Login for {{ creds.name }} (shown only once):</p>
      <p class="mt-2 text-xl tabular-nums">Username: <b>{{ creds.username }}</b></p>
      <p class="text-xl tabular-nums">Password: <b>{{ creds.password }}</b></p>
      <button class="mt-2 text-base text-slate-500 underline" @click="creds = null">Close</button>
    </div>
    <p v-if="error" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-4 text-lg font-semibold text-[#b91c1c]">{{ error }}</p>

    <div class="mb-8 space-y-4 rounded-2xl border border-[#e5e0f7] bg-white p-5">
      <h2 class="text-xl font-bold">New Teacher</h2>
      <label class="block"><span class="font-semibold">Name</span><input v-model="name" class="mt-1 w-full rounded-lg border border-slate-300 p-3 text-lg" /></label>
      <div>
        <span class="font-semibold">Assignments (grade + subjects)</span>
        <div v-for="(a, i) in assignments" :key="i" class="mt-2 flex flex-col gap-2 sm:flex-row">
          <select v-model="a.gradeLevel" class="rounded-lg border border-slate-300 p-3 text-lg sm:w-44"><option value="">Grade…</option><option v-for="[v, l] in GRADE_LEVELS" :key="v" :value="v">{{ l }}</option></select>
          <input v-model="a.subjectsText" placeholder="Math, English, Science" class="flex-1 rounded-lg border border-slate-300 p-3 text-lg" />
          <button v-if="assignments.length > 1" class="rounded-lg border-2 border-slate-300 px-3 text-lg text-slate-600" @click="removeRow(i)">Remove</button>
        </div>
        <button class="mt-2 text-lg font-semibold text-[#4c1d95] underline" @click="addRow">+ Add grade</button>
      </div>
      <button class="inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-[#6d28d9] px-6 text-xl font-bold text-white hover:bg-[#5b21b6] disabled:opacity-60" :disabled="saving" @click="submit">{{ saving ? 'Creating…' : 'Create teacher' }}</button>
    </div>

    <h2 class="mb-3 text-xl font-bold">Current teachers</h2>
    <p v-if="!teachers.length" class="text-lg text-slate-600">No teachers yet.</p>
    <ul v-else class="space-y-3">
      <li v-for="t in teachers" :key="t._id" class="rounded-xl border border-[#e5e0f7] bg-white p-4">
        <div v-if="editId !== t._id">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-lg font-bold">{{ t.name }}
                <span class="ml-2 rounded px-2 py-0.5 text-sm font-semibold" :class="t.active ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#b91c1c]'">{{ t.active ? 'Active' : 'Disabled' }}</span>
              </p>
              <p class="text-slate-600">Username: <b class="tabular-nums">{{ t.username }}</b></p>
              <p v-if="t.assignments?.length" class="mt-1 text-slate-600"><span v-for="(a, i) in t.assignments" :key="i">{{ labelOf(a.gradeLevel) }}<template v-if="a.subjects?.length"> ({{ a.subjects.join(', ') }})</template><template v-if="i < t.assignments.length - 1">; </template></span></p>
              <p v-else class="mt-1 text-slate-400">No assignments set</p>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button class="rounded-lg border-2 border-[#4c1d95] px-3 py-2 text-sm font-semibold text-[#4c1d95] hover:bg-[#f5f3ff]" @click="startEdit(t)">Edit</button>
            <button class="rounded-lg border-2 border-[#4c1d95] px-3 py-2 text-sm font-semibold text-[#4c1d95] hover:bg-[#f5f3ff]" :disabled="busyId === t._id" @click="reset(t)">Reset password</button>
            <button class="rounded-lg border-2 px-3 py-2 text-sm font-semibold" :class="t.active ? 'border-[#b45309] text-[#b45309]' : 'border-[#15803d] text-[#15803d]'" :disabled="busyId === t._id" @click="toggle(t)">{{ t.active ? 'Deactivate' : 'Activate' }}</button>
            <button class="rounded-lg border-2 border-[#b91c1c] px-3 py-2 text-sm font-semibold text-[#b91c1c] hover:bg-[#b91c1c] hover:text-white" :disabled="busyId === t._id" @click="del(t)">Delete</button>
          </div>
        </div>
        <!-- inline edit -->
        <div v-else class="space-y-3">
          <input v-model="editForm.name" class="w-full rounded-lg border border-slate-300 p-3 text-lg" />
          <div v-for="(a, i) in editForm.assignments" :key="i" class="flex flex-col gap-2 sm:flex-row">
            <select v-model="a.gradeLevel" class="rounded-lg border border-slate-300 p-2 sm:w-44"><option value="">Grade…</option><option v-for="[v, l] in GRADE_LEVELS" :key="v" :value="v">{{ l }}</option></select>
            <input v-model="a.subjectsText" placeholder="Math, English" class="flex-1 rounded-lg border border-slate-300 p-2" />
            <button v-if="editForm.assignments.length > 1" class="rounded-lg border-2 border-slate-300 px-3 text-slate-600" @click="editRemoveRow(i)">Remove</button>
          </div>
          <button class="text-sm font-semibold text-[#4c1d95] underline" @click="editAddRow">+ Add grade</button>
          <div class="flex gap-2">
            <button class="rounded-xl bg-[#6d28d9] px-5 py-2 font-bold text-white hover:bg-[#5b21b6]" :disabled="busyId === t._id" @click="saveEdit(t._id)">Save</button>
            <button class="rounded-xl border-2 border-slate-400 px-5 py-2 font-semibold text-slate-700" @click="editId = ''">Cancel</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
