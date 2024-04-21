import 'primeicons/primeicons.css'
import { createApp } from 'vue'
import 'primevue/resources/themes/aura-light-green/theme.css'
import PrimeVue from 'primevue/config';
import axios from 'axios';
import App from './App.vue'

const app = createApp(App);
app.use(PrimeVue);
app.use(axios);
app.mount('#app')
