import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createGtag } from 'vue-gtag'
import './firebase'

import 'bootswatch/dist/sketchy/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'

const app = createApp(App).use(router)

// Initialize gtag
app.use(createGtag({
  tagId: 'G-6HH8MQN7HB',
  config: {
    anonymize_ip: true
  }
}))

app.mount('#app')
