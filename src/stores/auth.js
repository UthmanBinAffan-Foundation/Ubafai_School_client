import { defineStore } from 'pinia';
import http from '@/api/http';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),
  getters: {
    isAuthed: (s) => !!s.token,
    role: (s) => s.user?.role || null,
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
      this.token = null; this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },
});
