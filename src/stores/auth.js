import { defineStore } from 'pinia';
import http from '@/api/http';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    impersonating: !!localStorage.getItem('imp_token'),
  }),
  getters: {
    isAuthed: (s) => !!s.token,
    role: (s) => s.user?.role || null,
    permissions: (s) => s.user?.permissions || [],
  },
  actions: {
    async login(username, password) {
      const { data } = await http.post('/auth/login', { username, password });
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    },
    logout() {
      this.token = null; this.user = null; this.impersonating = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('imp_token');
      localStorage.removeItem('imp_user');
    },
    // SUPERADMIN: tingnan ang parent/teacher account (kind: 'guardian'|'teacher')
    async impersonate(kind, id) {
      const { data } = await http.post('/auth/impersonate', { kind, id });
      if (!localStorage.getItem('imp_token')) {
        localStorage.setItem('imp_token', this.token);
        localStorage.setItem('imp_user', JSON.stringify(this.user));
      }
      this.token = data.token; this.user = data.user; this.impersonating = true;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    },
    stopImpersonating() {
      const t = localStorage.getItem('imp_token');
      const u = localStorage.getItem('imp_user');
      if (t && u) { this.token = t; this.user = JSON.parse(u); localStorage.setItem('token', t); localStorage.setItem('user', u); }
      localStorage.removeItem('imp_token');
      localStorage.removeItem('imp_user');
      this.impersonating = false;
    },
  },
});
