<template>
  <div v-if="bannerVisible" class="cookie-banner">
    <div class="cookie-banner-content">
      <p>
        We use cookies to enhance your experience, including Google Analytics for website analytics and reCAPTCHA for security.
        By accepting, you consent to the use of these cookies. You can learn more in our
        <router-link to="/privacy">Privacy Policy</router-link> and
        <router-link to="/cookie-policy">Cookie Policy</router-link>.
      </p>
      <div class="cookie-buttons">
        <button @click="acceptCookies" class="btn btn-primary btn-sm">Accept All</button>
        <button @click="rejectCookies" class="btn btn-secondary btn-sm">Reject All</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCookieConsent } from '../src/composables/useCookieConsent'

const { bannerVisible, acceptCookies, rejectCookies } = useCookieConsent()
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 1rem;
  z-index: 1000;
}

.cookie-banner a {
  color: white;
  text-decoration: underline;
}

.cookie-banner-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.cookie-buttons {
  margin-top: 1rem;
}

.cookie-buttons button {
  margin: 0 0.5rem;
}
</style>
