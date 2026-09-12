<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import http from '@/api/http';

const route = useRoute();
const data = ref({ student: null, periods: [] });
const loading = ref(false);
const error = ref('');
const peso = (n) => `\u20B1${Number(n || 0).toLocaleString('en-PH')}`;

async function load() {
  loading.value = true; error.value = '';
  try { data.value = (await http.get(`/students/${route.params.id}/grades`)).data; }
  catch { error.value = 'Could not load grades. Please try again.'; }
  finally { loading.value = false; }
}
onMounted(load);
</script>

<template>
  <div class="text-[#241b33]">
    <router-link to="/portal" class="text-lg font-semibold text-[#5b21b6] underline">&larr; Back to balance</router-link>
    <p v-if="data.student" class="mb-6 text-lg text-slate-600">{{ data.student.name }}</p>

    <p v-if="error" class="mb-4 rounded-xl bg-[#fee2e2] px-5 py-4 text-lg font-semibold text-[#b91c1c]">{{ error }}</p>
    <p v-if="loading" class="py-10 text-center text-xl text-slate-600">Loading grades&hellip;</p>

    <div v-else class="space-y-5">
      <section v-for="p in data.periods" :key="p.period" class="overflow-hidden rounded-2xl border border-[#e5e0f7] bg-white">
        <div class="flex items-center justify-between gap-2 px-5 py-3"
             :class="p.locked ? 'bg-[#fef2f2]' : 'bg-[#f5f3ff]'">
          <span class="text-xl font-bold">{{ p.label }}</span>
          <span class="rounded-lg px-3 py-1 text-base font-semibold"
                :class="p.locked ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#dcfce7] text-[#15803d]'">
            {{ p.locked ? 'Locked' : 'Open' }}
          </span>
        </div>

        <div class="p-5">
          <!-- LOCKED: pinaka-diwa ng feature — magbayad para makita -->
          <div v-if="p.locked">
            <p class="text-lg text-slate-700">
              Locked ang grades sa term na ito. You have natitira pang
              <b class="text-[#b91c1c]">{{ peso(p.balance) }}</b> left to pay.
            </p>
            <router-link to="/portal/pay"
              class="mt-3 inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#6d28d9] px-6 text-lg font-bold text-white hover:bg-[#5b21b6]">
              Pay to unlock
            </router-link>
          </div>

          <!-- UNLOCKED pero wala pang post -->
          <p v-else-if="!p.posted" class="text-lg text-slate-600">No grades posted for this term yet.</p>

          <!-- UNLOCKED + may grades -->
          <div v-else>
            <ul>
              <li v-for="s in p.subjects" :key="s.subject" class="flex items-center justify-between border-b border-[#efeafc] py-2">
                <span class="text-lg">{{ s.subject }}</span>
                <b class="text-lg tabular-nums">{{ s.grade }}</b>
              </li>
            </ul>
            <p v-if="p.generalAverage != null" class="mt-3 text-right text-lg">
              General average: <b class="tabular-nums">{{ p.generalAverage }}</b>
            </p>
          </div>
        </div>
      </section>

      <p v-if="!data.periods.length && !loading" class="text-lg text-slate-600">No active term with grades.</p>
    </div>
  </div>
</template>
