<template>
  <BRow class="justify-content-md-center">
    <BCol md="8">
      <h1 class="text-center mb-4">How Carpollies Work</h1>
      <div class="flowchart">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h3>Create a Polly</h3>
            <p>This is an event like: "Going ice skating on Friday the 7th of November."</p>
          </div>
        </div>
        <div class="arrow"><i class="bi bi-heart-arrow"></i></div>
        <div class="step parrot-card">
          <div class="step-number">2</div>
          <div class="step-content">
            <h3>Share the Polly URL</h3>
            <p>Share the Polly URL with potential drivers and other parrots who might need a ride to the event.</p>
            <p class="text-warning"><strong>Beware:</strong> Like parrots, Pollies are public for everyone to see! Anyone with the link can join in.</p>
          </div>
        </div>
        <div class="arrow"><i class="bi bi-heart-arrow"></i></div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h3>Let Parrots Join</h3>
            <p>Let the parrots add themselves as driver or as passenger.</p>
            <ul>
              <li><strong>As a driver:</strong> You can say where you'll be and how many spots you have in your car.</li>
              <li><strong>As a passenger:</strong> You can add some comments like: "I talk all the time, beware."</li>
            </ul>
          </div>
        </div>
        <div class="arrow"><i class="bi bi-heart-arrow"></i></div>
        <div class="step">
          <div class="step-number">4</div>
          <div class="step-content">
            <h3>Go to the Event</h3>
            <p>Just go to the event, with all parrots neatly divided over the available cars.</p>
          </div>
        </div>
      </div>
    </BCol>
  </BRow>
</template>

<script setup lang="ts">
// No script needed for this component
</script>

<style scoped>
.flowchart {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px solid #ddd;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  max-width: 600px;
  width: 100%;
}

.step-number {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
  margin-right: 20px;
  background-color: #f8f9fa;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-content h3 {
  margin-top: 0;
}

.arrow {
  font-size: 3rem;
  color: #5b6875;
  display: flex;
  justify-content: center;
}

.arrow i {
  transform: rotate(90deg);
}
@media (max-width: 768px) {
  .parrot-card::after {
    left: 10%;
  }
}
</style>
