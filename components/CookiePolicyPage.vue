<template>
  <BRow class="justify-content-md-center">
    <BCol md="8">
      <h1 class="text-center mb-4">Cookie Policy</h1>
      <BCard bg-variant="light" class="parrot-card">
        <iframe
          src="/cookiepolicy.html"
          width="100%"
          height="600px"
          frameborder="0"
          style="border: 0;"
        ></iframe>
      </BCard>
    </BCol>
  </BRow>
</template>

<script setup lang="ts">
import { BCard, BCol, BRow } from 'bootstrap-vue-next'

// Component name: CookiePolicyPage to follow multi-word naming convention
</script>

<style scoped>
.parrot-card {
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  transition: box-shadow 0.15s ease-in-out;
}

.parrot-card:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.lead {
  font-size: 1.25rem;
  font-weight: 300;
}
</style>
