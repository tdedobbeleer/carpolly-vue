<script setup lang="ts">
import { BNavbar, BNavbarBrand, BContainer, BApp } from 'bootstrap-vue-next'
</script>

<template>
    <BApp>
        <BNavbar toggleable="lg" type="light" variant="light" class="m-2">
            <BNavbarBrand href="#">
              <h1>Carpolly</h1>
              <h3>Wraaaark!</h3>
            </BNavbarBrand>
        </BNavbar>
        <BContainer>
            <router-view />
        </BContainer>
  </BApp>
</template>

<style scoped></style>
