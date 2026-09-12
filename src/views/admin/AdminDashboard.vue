<script setup>
import { ref, onMounted } from 'vue';
import http from '@/api/http';
// Dashboard = "To-Do List". Bubble-up ang pending tasks (spec 3.1).
const pendingCount = ref(0);
onMounted(async () => {
  try { pendingCount.value = (await http.get('/payments/pending')).data.length; } catch {}
});
</script>

<template>
  <h1 class="text-2xl font-bold mb-4">Welcome, Admin</h1>
  <router-link to="/admin/verify" class="block bg-white p-5 rounded-xl shadow mb-3">
    <span class="text-3xl font-bold text-pending">{{ pendingCount }}</span>
    <span class="text-lg"> payment(s) awaiting verification</span>
  </router-link>
  <router-link to="/admin/masterlist" class="block bg-white p-5 rounded-xl shadow">
    View the Digital Masterlist
  </router-link>
</template>
