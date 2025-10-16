import { createRouter, createWebHistory } from 'vue-router'
import CreatePolly from '../../components/CreatePolly.vue'
import GetPolly from '../../components/GetPolly.vue'
import FAQ from '../../components/FAQ.vue'
import AboutPage from '../../components/AboutPage.vue'

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
  },
  {
    path: '/faq',
    name: 'FAQ',
    component: FAQ
  },
  {
    path: '/about',
    name: 'AboutPage',
    component: AboutPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
