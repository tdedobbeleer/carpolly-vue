<template>
  <BRow class="justify-content-md-center">
    <BCol md="8">
      <h1 class="text-center mb-4">Support</h1>
      <BCard bg-variant="light" class="parrot-card">
        <iframe title="Feedback Form" class="freshwidget-embedded-form" id="freshwidget-embedded-form" src="https://carpolly.freshdesk.com/widgets/feedback_widget/new?&widgetType=embedded&formTitle=How+can+we+help+you?&submitTitle=Send&submitThanks=Thanks!+As+soon+as+I+find+a+ride+to+the+office%2C+I'll+look+at+this!&searchArea=no" scrolling="auto" height="550px" width="100%" frameborder="0">
        </iframe>
      </BCard>
    </BCol>
  </BRow>

</template>


<script setup lang="ts">
import { onMounted } from 'vue'
import { BCard, BCol, BRow } from 'bootstrap-vue-next'

onMounted(() => {
  // Load Freshdesk widget script
  if (!document.querySelector('script[src*="freshdesk"]')) {
    const script = document.createElement('script')
    script.src = 'https://s3.amazonaws.com/assets.freshdesk.com/widget/freshwidget.js'
    script.type = 'text/javascript'
    document.head.appendChild(script)
  }

  // Load Freshdesk widget CSS
  if (!document.querySelector('link[href*="freshdesk"]')) {
    const link = document.createElement('link')
    link.href = 'https://s3.amazonaws.com/assets.freshdesk.com/widget/freshwidget.css'
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.media = 'screen, projection'
    document.head.appendChild(link)
  }
})


</script>

<style scoped>
.parrot-card {
  border: 2px solid #6c757d;
  border-radius: 10px;
}
</style>
