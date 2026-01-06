import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import Home from '../views/Home.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/phd',
    name: 'PHD',
    component: () => import(/* webpackChunkName: "phd" */ '../views/PHDLogViewer.vue'),
  },
  {
    path: '/equipment',
    name: 'Equipment',
    component: () => import(/* webpackChunkName: "equipment" */ '../views/Equipment.vue'),
  },
  {
    path: '/methodology',
    name: 'Methodology',
    component: () => import(/* webpackChunkName: "methodology" */ '../views/Methodology.vue'),
  },
  {
    path: '/telescope-sim',
    name: 'TelescopeSimulator',
    component: () => import(/* webpackChunkName: "telescope-sim" */ '../views/TelescopeSimulator.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
