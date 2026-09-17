import { defineStore } from 'pinia';
import http from '@/api/http';

export const useSchoolYearStore = defineStore('schoolYear', {
  state: () => ({ years: [], selected: '' }),
  getters: {
    activeId: (s) => s.years.find((y) => y.isActive)?._id || '',
    activeLabel: (s) => s.years.find((y) => y.isActive)?.label || '',
    selectedLabel: (s) => s.years.find((y) => y._id === s.selected)?.label || '',
    isViewingPast() { return !!this.selected && this.selected !== this.activeId; },
  },
  actions: {
    async load() {
      try {
        const { data } = await http.get('/school/years');
        this.years = data;
        const active = data.find((y) => y.isActive);
        if (!this.selected || !data.some((y) => y._id === this.selected)) this.selected = active?._id || data[0]?._id || '';
      } catch { /* ignore */ }
    },
    resetView() { this.selected = this.activeId; },
    async createYear(label) { await http.post('/school/years', { label }); await this.load(); },
    async activate(id) { await http.put(`/school/years/${id}/activate`); await this.load(); },
  },
});
