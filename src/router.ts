import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/welcome',
  },
  {
    path: '/welcome',
    name: 'welcome',
    component: () => import('./views/WelcomeView.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('./views/ProfileView.vue'),
  },
  {
    path: '/discovery',
    name: 'discovery',
    component: () => import('./views/RiskDiscoveryView.vue'),
  },
  {
    path: '/graph',
    name: 'graph',
    component: () => import('./views/GraphView.vue'),
  },
  {
    path: '/blind-spots',
    name: 'blindSpots',
    component: () => import('./views/BlindSpotsView.vue'),
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('./views/ResultsView.vue'),
  },
  {
    path: '/compliance',
    name: 'compliance',
    component: () => import('./views/ComplianceMatrixView.vue'),
  },
  {
    path: '/implementation',
    name: 'implementation',
    component: () => import('./views/ImplementationView.vue'),
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
