<script setup lang="ts">
import { BNavbar, BContainer, BApp, BNav, BNavItem, BNavbarBrand } from 'bootstrap-vue-next'
</script>

<template>
    <BApp>
        <BNavbar toggleable="lg" type="light" class="m-2 position-relative">
          <BNavbarBrand href="/">
            <img src="/logo.png" class="float-end me-2 logo" alt="CarPolly Logo">
          </BNavbarBrand>
          <h1 class="d-lg-none ms-2 text-decoration-underline">CarPolly</h1>
          <h1 class="text-decoration-underline position-absolute top-50 start-50 translate-middle d-none d-lg-block">CarPolly</h1>
          <BNav class="ms-auto">
            <BNavItem to="/">Home</BNavItem>
            <BNavItem to="/faq">FAQ</BNavItem>
            <BNavItem to="/about">About</BNavItem>
          </BNav>
        </BNavbar>
        <BContainer>
            <router-view />
        </BContainer>
        <footer class="text-center mt-5 p-3">
            <p>Created by Tom De Dobbeleer with a bit of <i class="bi bi-heart"></i> from <a href="https://kilocode.ai" target="_blank">Kilo AI assistant</a>.</p>
            <div class="d-flex justify-content-center align-items-center gap-3">
              <a href="https://github.com/tomdedobbeleer/carpolly-vue" target="_blank" rel="noopener noreferrer" title="View on GitHub">
                <i class="bi bi-github fs-2"></i>
              </a>
              <a href="https://buymeacoffee.com/tdedobbeleer" target="_blank" rel="noopener noreferrer" title="Buy me a coffee">
                <i class="bi bi-cup-hot-fill fs-2"></i>
              </a>
            </div>
        </footer>
  </BApp>
</template>

<style>
.logo {
  max-width: 100px !important;
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

@media (min-width: 768px) {
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
}
@media (max-width: 768px) {
  .parrot-card::after {
    content: '';
    position: absolute;
    bottom: -80px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 100px;
    background-image: url('/parrot-below.png');
    background-size: cover;
    background-position: center;
  }
}
</style>
