import { createApp } from 'vue'
import '/node_modules/primeflex/primeflex.css'
import 'primevue/resources/themes/aura-light-green/theme.css'
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config';
import axios from 'axios';
import App from './App.vue'

const app = createApp(App);
app.use(PrimeVue);
app.use(axios);
app.mount('#app')
