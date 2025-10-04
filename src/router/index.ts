import { createRouter, createWebHistory } from 'vue-router'
import CreatePolly from '../../components/CreatePolly.vue'
import GetPolly from '../../components/GetPolly.vue'

const routes = [
  {
    path: '/',
    name: 'CreatePolly',
    component: CreatePolly
  },
  {
    path: '/polly/:id',
    name: 'GetPolly',
    component: GetPolly,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
