import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './firebase'

import 'bootswatch/dist/sketchy/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

createApp(App).use(router).mount('#app')
