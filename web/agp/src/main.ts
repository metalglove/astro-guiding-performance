import { createApp } from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';

import { Chart, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';


Chart.register(...registerables, zoomPlugin);

const app = createApp(App)
  .use(store)
  .use(router);

app.mount('#app');
