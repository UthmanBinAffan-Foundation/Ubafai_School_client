// Per-page access para sa REGISTRAR. ADMIN/SUPERADMIN = buong access.
export const ADMIN_PAGES = [
  { key: 'dashboard', to: '/admin', label: 'Dashboard', adminOnly: true },
  { key: 'verify', to: '/admin/verify', label: 'Payment Verification' },
  { key: 'cash', to: '/admin/cash', label: 'Record Cash Payment' },
  { key: 'applications', to: '/admin/applications', label: 'Enrollment Application' },
  { key: 'teachers', to: '/admin/teachers', label: 'Teachers' },
  { key: 'parents', to: '/admin/parents', label: 'Parents' },
  { key: 'masterlist', to: '/admin/masterlist', label: 'Masterlist' },
  { key: 'fees', to: '/fees', label: 'Fees' },
  { key: 'enroll', to: '/admin/enroll', label: 'Manual Enroll' },
  { key: 'registrars', to: '/admin/registrars', label: 'Registrars', adminOnly: true },
  { key: 'settings', to: '/admin/settings', label: 'Settings' },
];
// Mga page na pwedeng ibigay sa registrar (hindi kasama ang dashboard/registrars)
export const GRANTABLE_PAGES = ADMIN_PAGES.filter((p) => !p.adminOnly);
export const REGISTRAR_DEFAULT = ['cash', 'applications', 'masterlist', 'fees'];

export function permForPath(path) {
  if (path.startsWith('/admin/cash')) return 'cash';
  if (path.startsWith('/admin/verify')) return 'verify';
  if (path.startsWith('/admin/applications')) return 'applications';
  if (path.startsWith('/admin/enroll')) return 'enroll';
  if (path.startsWith('/admin/masterlist') || path.startsWith('/admin/student') || path.startsWith('/admin/receipt')) return 'masterlist';
  if (path.startsWith('/fees')) return 'fees';
  if (path.startsWith('/admin/teachers')) return 'teachers';
  if (path.startsWith('/admin/parents')) return 'parents';
  if (path.startsWith('/admin/settings')) return 'settings';
  if (path.startsWith('/admin/registrars')) return 'registrars';
  return null; // dashboard, etc.
}

export function defaultRouteFor(role, perms = []) {
  if (role === 'GUARDIAN') return '/portal';
  if (role === 'TEACHER') return '/teacher';
  if (role === 'REGISTRAR') {
    const order = ['cash', 'applications', 'masterlist', 'fees', 'verify', 'enroll', 'teachers', 'parents', 'settings'];
    const first = order.find((k) => perms.includes(k));
    const page = ADMIN_PAGES.find((p) => p.key === first);
    return page ? page.to : '/login';
  }
  return '/admin';
}
