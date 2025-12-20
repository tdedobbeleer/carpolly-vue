import { createRouter, createWebHistory } from 'vue-router'
import CreatePolly from '../../components/CreatePolly.vue'
import GetPolly from '../../components/GetPolly.vue'
import FAQ from '../../components/FAQ.vue'
import AboutPage from '../../components/AboutPage.vue'
import SupportPage from '../../components/SupportPage.vue'
import PrivacyPage from '../../components/PrivacyPage.vue'
import CookiePolicyPage from '../../components/CookiePolicyPage.vue'
import SettingsPage from '../../components/SettingsPage.vue'

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
  },
  {
    path: '/support',
    name: 'SupportPage',
    component: SupportPage
  },
    {
    path: '/privacy',
    name: 'Privacy',
    component: PrivacyPage
  },
  {
    path: '/cookie-policy',
    name: 'CookiePolicy',
    component: CookiePolicyPage
  },
  {
    path: '/settings',
    name: 'SettingsPage',
    component: SettingsPage
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
