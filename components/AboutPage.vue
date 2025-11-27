<template>
  <BRow class="justify-content-md-center">
    <BCol md="8">
      <h1 class="text-center mb-4">About CarPolly</h1>
      <BCard bg-variant="light" class="parrot-card">
        <p class="lead">
          CarPolly is a fun and easy way to organize carpools for events. Whether you're planning a trip to the ice rink,
          a concert, or any group outing, Carpollies helps you coordinate rides with your friends and fellow "parrots".
        </p>
        <p>
          Inspired by the social nature of parrots, CarPolly makes sharing rides as natural as a flock taking flight together.
          Create your event, share the link, and let everyone join as drivers or passengers. It's that simple!
        </p>
        <p>
          Our mission is to make group transportation hassle-free, so you can focus on enjoying the event rather than
          worrying about logistics.
        </p>
        <p>
          And finally: if you're interested in parrots, especially the parrot in this site, please <a href="https://www.youtube.com/watch?v=4vuW6tQ0218" target="_blank" rel="noopener noreferrer">check this video on YouTube</a>. It will enlighten you.
        </p>
      </BCard>
    </BCol>
  </BRow>
</template>

<script setup lang="ts">
import { BCard, BCol, BRow } from 'bootstrap-vue-next'

// Component name: AboutPage to follow multi-word naming convention
</script>

<style scoped>
.about-page {
  padding: 2rem 0;
}

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
