<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSchoolYearStore } from '@/stores/schoolYear';

const auth = useAuthStore();
const syStore = useSchoolYearStore();
const router = useRouter();
const isAdmin = () => ['ADMIN', 'SUPERADMIN'].includes(auth.role);
watch(() => auth.isAuthed, (v) => { if (v && isAdmin()) syStore.load(); }, { immediate: true });
const route = useRoute();

const isOpen = ref(false);
const open = () => { isOpen.value = true; };
const close = () => { isOpen.value = false; };
const logout = () => { close(); auth.logout(); router.push('/login'); };
watch(() => route.path, () => close());

const now = ref(new Date());
let timer;
onMounted(() => { timer = setInterval(() => { now.value = new Date(); }, 1000); });
onUnmounted(() => clearInterval(timer));
const dateStr = computed(() => now.value.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
const timeStr = computed(() => now.value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));

const logoOk = ref(true);

const ICONS = {
  dashboard: 'M3 11l9-7 9 7M5 10v10h14V10',
  verify: 'M20 6 9 17l-5-5',
  cash: 'M3 7h18v10H3zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M6 10h.01M18 14h.01',
  enroll: 'M9 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M18 8v6M15 11h6',
  teachers: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M2 20c0-3 2.5-5 7-5s7 2 7 5M17 9a2.2 2.2 0 1 0 0-4.4M16 15c3 .3 5 2 5 5',
  deadline: 'M3 4.5h18v16H3zM3 9h18M8 3v3M16 3v3',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  settings: 'M4 21v-6M4 11V3M12 21v-8M12 9V3M20 21v-4M20 13V3M1 15h6M9 9h6M17 17h6',
  wallet: 'M3 6h18v13H3zM3 10h18M16 14h2',
  card: 'M3 5h18v14H3zM3 10h18',
  grades: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h9',
  fees: 'M4 7h16v10H4zM4 11h16M8 15h4',
};

const NAV = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { to: '/admin/verify', label: 'Payment Verification', icon: 'verify' },
    { to: '/admin/cash', label: 'Record Cash Payment', icon: 'cash' },
    { to: '/admin/applications', label: 'Enrollment Application', icon: 'enroll' },
    { to: '/admin/teachers', label: 'Teachers', icon: 'teachers' },
    { to: '/admin/parents', label: 'Parents', icon: 'teachers' },
    { to: '/admin/masterlist', label: 'Masterlist', icon: 'list' },
    { to: '/fees', label: 'Fees', icon: 'fees' },
    { to: '/admin/settings', label: 'Settings', icon: 'settings' },
  ],
  guardian: [
    { to: '/portal', label: 'Balance', icon: 'wallet' },
    { to: '/portal/pay', label: 'Pay', icon: 'card' },
    { to: '/fees', label: 'Fees', icon: 'fees' },
  ],
  teacher: [
    { to: '/teacher', label: 'Grades', icon: 'grades' },
  ],
};

const items = computed(() => {
  if (['ADMIN', 'SUPERADMIN'].includes(auth.role)) return NAV.admin;
  if (auth.role === 'GUARDIAN') return NAV.guardian;
  if (auth.role === 'TEACHER') return NAV.teacher;
  return [];
});
const isActive = (to) => route.path === to || (to !== '/admin' && route.path.startsWith(to + '/'));

const PAGES = {
  '/admin':            { title: 'Dashboard',                  icon: 'dashboard' },
  '/admin/verify':     { title: 'Payment Verification',         icon: 'verify' },
  '/admin/cash':       { title: 'Record Cash Payment',          icon: 'cash' },
  '/admin/enroll':     { title: 'Enroll Student',   icon: 'enroll' },
  '/admin/teachers':   { title: 'Teachers',                   icon: 'teachers' },
  '/admin/parents':    { title: 'Parents',               icon: 'teachers' },
  '/admin/masterlist': { title: 'Student List', icon: 'list' },
  '/admin/settings':   { title: 'Settings',                icon: 'settings' },
  '/portal':           { title: "Children's Balances",        icon: 'wallet' },
  '/portal/pay':       { title: 'Submit Payment',         icon: 'card' },
  '/teacher':          { title: 'Encode Grades',       icon: 'grades' },
};
const currentPage = computed(() => {
  if (route.path.startsWith('/admin/student/')) return { title: 'Student Ledger', icon: 'list' };
  if (route.path.startsWith('/portal/grades/')) return { title: 'Report Card', icon: 'grades' };
  return PAGES[route.path] || { title: '', icon: 'dashboard' };
});
</script>

<template>
  <div class="min-h-screen">
    <div v-if="auth.isAuthed && isOpen" class="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" @click="close"></div>

    <aside v-if="auth.isAuthed"
      class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-[#4c1d95] to-[#5b21b6] text-violet-100 shadow-xl transition-transform duration-200 lg:translate-x-0"
      :class="isOpen ? 'translate-x-0' : '-translate-x-full'">
      <div class="flex items-center gap-3 px-5 py-5">
        <img v-if="logoOk" src="/logo192.png" alt="Logo" class="h-11 w-11 rounded-xl bg-white/15 object-contain p-1" @error="logoOk = false" />
        <div v-else class="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl font-bold text-white">U</div>
        <div>
          <p class="text-lg font-bold leading-tight text-white">UBAFAI</p>
          <p class="text-sm text-violet-200">Management System</p>
        </div>
      </div>
      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <router-link v-for="it in items" :key="it.to" :to="it.to" @click="close"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-base font-medium transition-colors"
          :class="isActive(it.to) ? 'bg-white/15 text-white' : 'text-violet-100 hover:bg-white/10 hover:text-white'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 shrink-0"><path :d="ICONS[it.icon]" /></svg>
          <span>{{ it.label }}</span>
        </router-link>
      </nav>
      <div class="border-t border-white/10 p-3">
        <button @click="logout" class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-violet-100 transition-colors hover:bg-white/10 hover:text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 shrink-0"><path :d="ICONS.logout" /></svg>
          <span>Log Out</span>
        </button>
      </div>
    </aside>

    <div :class="auth.isAuthed ? 'lg:pl-64' : ''">
      <header v-if="auth.isAuthed" class="sticky top-0 z-20 border-b border-[#e5e0f7] bg-white/85 backdrop-blur">
        <div class="flex items-center gap-3 px-4 py-2.5">
          <button @click="open" aria-label="Open menu" class="rounded-lg p-1 text-[#4c1d95] lg:hidden">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-7 w-7"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <img v-if="logoOk" src="/logo192.png" alt="Logo" class="h-9 w-9 rounded-lg object-contain" @error="logoOk = false" />
          <div v-else class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4c1d95] text-base font-bold text-white">U</div>
          <div class="leading-tight">
            <p class="font-bold text-[#4c1d95]">UBAFAI</p>
            <p class="hidden text-xs text-slate-500 sm:block">Management System</p>
          </div>
          <div class="ml-auto flex items-center gap-3 text-right">
            <select v-if="isAdmin() && syStore.years.length" v-model="syStore.selected" class="rounded-lg border border-[#e5e0f7] bg-white px-2 py-1 text-sm text-[#4c1d95]" title="School Year">
              <option v-for="y in syStore.years" :key="y._id" :value="y._id">{{ y.label }}{{ y.isActive ? ' (current)' : '' }}</option>
            </select>
            <div class="hidden sm:block leading-tight">
              <p class="text-xs text-slate-500">Logged in as</p>
              <p class="font-semibold text-[#241b33]">{{ auth.user?.username }}
                <span class="ml-1 rounded bg-[#f5f3ff] px-1.5 py-0.5 text-xs font-bold text-[#6d28d9]">{{ auth.role }}</span>
              </p>
            </div>
            <div class="leading-tight">
              <p class="text-xs font-medium text-[#241b33] sm:text-sm">{{ dateStr }}</p>
              <p class="text-xs text-slate-500 tabular-nums">{{ timeStr }}</p>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 px-4 pb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-[#6d28d9]"><path :d="ICONS[currentPage.icon]" /></svg>
          <h1 class="text-xl font-bold text-[#5b21b6]">{{ currentPage.title }}</h1>
        </div>
      </header>

      <main class="mx-auto max-w-4xl p-4 lg:p-8"><router-view /></main>
    </div>
  </div>
</template>
