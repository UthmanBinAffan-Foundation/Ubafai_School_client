import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { defaultRouteFor, permForPath } from '@/permissions';

const admin = { roles: ['ADMIN', 'SUPERADMIN'] };
const routes = [
  { path: '/login', component: () => import('@/views/LoginView.vue'), meta: { public: true } },
  { path: '/apply', component: () => import('@/views/ApplyView.vue'), meta: { public: true } },

  { path: '/', redirect: '/admin' },
  { path: '/admin', component: () => import('@/views/admin/AdminDashboard.vue'), meta: admin },
  { path: '/admin/verify', component: () => import('@/views/admin/VerificationHub.vue'), meta: admin },
  { path: '/admin/cash', component: () => import('@/views/admin/CashPaymentView.vue'), meta: admin },
  { path: '/admin/applications', component: () => import('@/views/admin/ApplicationsView.vue'), meta: admin },
  { path: '/admin/enroll', component: () => import('@/views/admin/EnrollStudentView.vue'), meta: admin },
  { path: '/admin/teachers', component: () => import('@/views/admin/TeachersView.vue'), meta: admin },
  { path: '/admin/parents', component: () => import('@/views/admin/GuardiansView.vue'), meta: admin },
  { path: '/admin/masterlist', component: () => import('@/views/admin/MasterlistView.vue'), meta: admin },
  { path: '/admin/settings', component: () => import('@/views/admin/SettingsView.vue'), meta: admin },
  { path: '/admin/registrars', component: () => import('@/views/admin/RegistrarsView.vue'), meta: admin },
  { path: '/fees', component: () => import('@/views/FeesView.vue'), meta: { roles: ['ADMIN', 'SUPERADMIN', 'GUARDIAN', 'TEACHER'] } },
  { path: '/admin/student/:id', component: () => import('@/views/admin/StudentLedgerView.vue'), meta: admin },
  { path: '/admin/receipt/:id', component: () => import('@/views/admin/ReceiptView.vue'), meta: admin },

  { path: '/portal', component: () => import('@/views/parent/ParentDashboard.vue'), meta: { roles: ['GUARDIAN'] } },
  { path: '/portal/pay', component: () => import('@/views/parent/SubmitPaymentView.vue'), meta: { roles: ['GUARDIAN'] } },
  { path: '/portal/enroll', component: () => import('@/views/parent/ParentEnrollView.vue'), meta: { roles: ['GUARDIAN'] } },
  { path: '/portal/grades/:id', component: () => import('@/views/parent/GradesView.vue'), meta: { roles: ['GUARDIAN'] } },
  { path: '/portal/ledger/:id', component: () => import('@/views/parent/ParentLedgerView.vue'), meta: { roles: ['GUARDIAN'] } },
  { path: '/portal/student/:id/edit', component: () => import('@/views/parent/ParentStudentEditView.vue'), meta: { roles: ['GUARDIAN'] } },

  { path: '/teacher', component: () => import('@/views/teacher/GradeEncodeView.vue'), meta: { roles: ['TEACHER', 'ADMIN', 'SUPERADMIN'] } },
];

const router = createRouter({ history: createWebHistory(), routes });
router.beforeEach((to) => {
  const auth = useAuthStore();
  const home = () => defaultRouteFor(auth.role, auth.permissions);
  if (to.path === '/login' && auth.isAuthed) return home();
  if (to.meta.public) return true;
  if (!auth.isAuthed) return '/login';
  if (auth.role === 'REGISTRAR') {
    const perm = permForPath(to.path);
    if (perm && auth.permissions.includes(perm)) return true;
    return home();
  }
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return home();
  return true;
});
export default router;
