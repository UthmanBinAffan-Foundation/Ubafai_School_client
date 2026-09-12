<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { isInstalled, promptInstall } from '@/pwa';

const username = ref(''); const password = ref(''); const error = ref('');
const showPassword = ref(false);
const auth = useAuthStore(); const router = useRouter();
const logoOk = ref(true);
const showTerms = ref(false);

async function submit() {
  error.value = '';
  try {
    const user = await auth.login(username.value, password.value);
    router.push(user.role === 'GUARDIAN' ? '/portal' : user.role === 'TEACHER' ? '/teacher' : '/admin');
  } catch (e) { error.value = e?.response?.data?.message || 'Incorrect username or password'; }
}

// PWA install (nahuli na sa main.js ang beforeinstallprompt)
const installMsg = ref('');
async function installApp() {
  installMsg.value = '';
  const outcome = await promptInstall();
  if (outcome === 'unavailable') {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    installMsg.value = isIOS
      ? 'Sa iPhone/iPad: pindutin ang Share, tapos \u201cAdd to Home Screen\u201d.'
      : 'If no prompt appears, refresh the page or try Chrome/Edge/Android (or the deployed HTTPS version).';
  } else if (outcome === 'accepted') {
    installMsg.value = 'Installing the app. Thank you!';
  }
}

const terms = [
  ['1. Information We Collect', 'We collect only the information needed for the service: student and parent names, LRN, grade level, contact number, fees (tuition and miscellaneous), grades, and payment records. Your actual password is never stored \u2014 it is encrypted (hashed), so no one can read it.'],
  ['2. Purpose of Use', 'Your data is used only for: generating and notifying fees, receiving and recording payments, managing the account and student grades, and improving the service. It is not used for any unrelated purpose.'],
  ['3. Data Security', 'Data is protected through encrypted passwords, a secure connection, and access control \u2014 only authorized people can access the information. We maintain reasonable safeguards against unauthorized access.'],
  ['4. Confidentiality', 'Your information is confidential. We do not sell, rent, or share it with third parties except when: (a) you consent, (b) required by law, or (c) necessary to deliver the service.'],
  ['5. Your Rights', 'You have the right to access, correct, or request a copy of your personal data, in line with the Data Privacy Act of 2012 (RA 10173). Contact the school administrator for this.'],
  ['6. Your Responsibility', 'You are responsible for safeguarding your username and password. Do not share your password with anyone, and change it immediately (or notify the admin) if you believe someone has learned it.'],
  ['7. Changes to These Terms', 'These terms may change from time to time. Continued use of the system means acceptance of any changes.'],
];
</script>

<template>
  <div class="fixed inset-0 overflow-auto bg-[#3b1580]">
    <!-- Scenic purple background -->
    <div class="absolute inset-0 bg-gradient-to-b from-[#2e1065] via-[#6d28d9] to-[#9a7fe0]"></div>
    <svg class="absolute inset-x-0 top-0 h-1/2 w-full opacity-80" fill="white">
      <circle cx="12%" cy="18%" r="1.6" /><circle cx="30%" cy="10%" r="1.2" /><circle cx="47%" cy="22%" r="1.4" />
      <circle cx="68%" cy="12%" r="1.2" /><circle cx="82%" cy="24%" r="1.7" /><circle cx="90%" cy="9%" r="1.2" />
    </svg>
    <svg class="absolute bottom-0 left-0 h-[46%] w-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
      <polygon points="0,400 0,230 210,150 430,250 660,120 900,240 1160,140 1440,250 1440,400" fill="#5b21b6" opacity="0.55" />
      <polygon points="0,400 0,300 260,210 500,300 740,205 1000,300 1250,225 1440,300 1440,400" fill="#3b1580" />
      <rect x="0" y="360" width="1440" height="40" fill="#2e1065" opacity="0.6" />
    </svg>

    <!-- Content -->
    <div class="relative z-10 flex min-h-full flex-col">
      <div class="flex flex-1 items-center justify-center p-4">
        <div class="w-full max-w-md rounded-3xl border border-white/25 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div class="mb-6 flex flex-col items-center">
            <img v-if="logoOk" :src="'/logo.png'" alt="Logo" class="mb-3 h-20 w-20 rounded-2xl object-contain" @error="logoOk = false" />
            <div v-else class="mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-3xl font-bold text-white">U</div>
            <h1 class="text-3xl font-bold text-white">Log in</h1>
            <p class="text-white/70">UBAFAI Portal</p>
          </div>

          <div class="space-y-4">
            <div class="relative">
              <input v-model="username" placeholder="Username" @keyup.enter="submit"
                class="w-full rounded-xl border border-white/25 bg-white/15 px-4 py-3 pr-11 text-lg text-white placeholder-white/60 backdrop-blur" />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" /></svg>
            </div>
            <div class="relative">
              <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Password" @keyup.enter="submit"
                class="w-full rounded-xl border border-white/25 bg-white/15 px-4 py-3 pr-11 text-lg text-white placeholder-white/60 backdrop-blur" />
              <button type="button" class="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword"><svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg><svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5"><path d="M3 3l18 18" /><path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" /><path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.7" /><path d="M6.1 6.1A17 17 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 3-.5" /></svg></button>
            </div>

            <p class="text-right text-sm text-white/70">Forgot your password? Contact the school admin.</p>
            <p v-if="error" class="rounded-lg bg-red-500/25 px-4 py-2 text-white">{{ error }}</p>

            <button @click="submit"
              class="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-[#1e1b2e] text-lg font-bold text-white transition-colors hover:bg-[#2a2540]">
              Log in
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <div class="mt-5 rounded-xl border border-white/25 bg-white/10 p-3 text-center">
              <p class="text-white/90">No account yet?</p>
              <router-link to="/apply" class="mt-1 inline-block font-bold text-white underline">Submit an enrollment application →</router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="relative z-10 px-4 pb-8 text-center text-white/90">
        <p v-if="isInstalled" class="mb-4 font-semibold text-white">The app is installed.</p>
        <button v-else @click="installApp"
          class="mx-auto mb-4 inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-white/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5"><path d="M12 3v12M8 11l4 4 4-4M4 21h16" /></svg>
          Install App
        </button>
        <p v-if="installMsg" class="mb-3 text-sm text-white/80">{{ installMsg }}</p>
        <p class="mb-1">
          <a href="https://ubafai.com/" target="_blank" rel="noopener" class="inline-flex items-center gap-1 underline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>
            Visit our website
          </a>
        </p>
        <p class="mb-2"><button class="underline" @click="showTerms = true">Data Confidentiality and Security Terms</button></p>
        <p class="text-sm text-white/70">&copy; 2026 Designed by: RDT Systems</p>
      </footer>
    </div>

    <!-- Terms modal -->
    <div v-if="showTerms" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" @click.self="showTerms = false">
      <div class="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-6 text-[#241b33]">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-[#5b21b6]">Data Confidentiality and Security Terms</h2>
            <p class="text-sm text-slate-500">Last updated: 2026</p>
          </div>
          <button class="rounded-lg bg-slate-100 px-3 py-1 text-lg font-bold" @click="showTerms = false">Close</button>
        </div>
        <p class="mb-4">Your privacy and the security of your information matter to us. These terms explain how we collect, use, and protect your data in this system.</p>
        <div v-for="[h, b] in terms" :key="h" class="mb-3">
          <h3 class="font-bold text-[#4c1d95]">{{ h }}</h3>
          <p>{{ b }}</p>
        </div>
        <p class="mt-4 text-slate-600">For any questions about your data, please contact the school administrator.</p>
      </div>
    </div>
  </div>
</template>
