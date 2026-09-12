import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import { initPwaInstall } from './pwa';
import './style.css';

initPwaInstall(); // humuli ng beforeinstallprompt bago mag-mount

createApp(App).use(createPinia()).use(router).mount('#app');
