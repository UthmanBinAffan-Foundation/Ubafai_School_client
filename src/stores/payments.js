import { defineStore } from 'pinia';
import http from '@/api/http';

export const usePaymentStore = defineStore('payments', {
  state: () => ({ pending: [], loading: false }),
  actions: {
    async fetchPending() {
      this.loading = true;
      try { this.pending = (await http.get('/payments/pending')).data; }
      finally { this.loading = false; }
    },
    async approve(id) {
      await http.patch(`/payments/${id}/verify`);
      this.pending = this.pending.filter((p) => p._id !== id);
    },
    async reject(id, reason) {
      await http.patch(`/payments/${id}/reject`, { reason });
      this.pending = this.pending.filter((p) => p._id !== id);
    },
  },
});
