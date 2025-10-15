<script setup lang="ts">
import { BNavbar, BContainer, BApp, BNav, BNavItem } from 'bootstrap-vue-next'
</script>

<template>
    <BApp>
        <BNavbar toggleable="lg" type="light" class="m-2 position-relative">
          <img src="/logo.png" class="float-end me-2 logo" alt="Carpolly Logo">
          <h1 class="d-lg-none ms-2">Carpolly</h1>
          <h1 class="position-absolute top-50 start-50 translate-middle d-none d-lg-block">Carpolly</h1>
          <BNav class="ms-auto">
            <BNavItem to="/faq">FAQ</BNavItem>
            <BNavItem to="/about">About</BNavItem>
          </BNav>
        </BNavbar>
        <BContainer>
            <router-view />
        </BContainer>
  </BApp>
</template>

<style>
.logo {
  max-width: 85px !important;
  height: auto;
}

@media (min-width: 768px) {
  .logo {
    max-width: 160px !important;
  }
}

body {
  background: linear-gradient(to right, #ff7e5f, #feb47b, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  min-height: 100vh;
}
.navbar {
  background-color: rgba(248, 249, 250, 0.5) !important;
}

.parrot-card {
  position: relative;
  overflow: visible;
}

.parrot-card::after {
  content: '';
  position: absolute;
  top: 65%;
  right: -65px;
  transform: translateY(-50%);
  width: 80px;
  height: 80px;
  background-image: url('/parrot.png');
  background-size: cover;
  background-position: center;
}
</style>
