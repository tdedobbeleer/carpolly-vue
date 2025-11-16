<template>
  <BRow class="justify-content-md-center">
    <BCol md="6">
      <h1>Let's get started!</h1>
      <BCard bg-variant="light" class="parrot-card">
      <BForm @submit.prevent="onSubmit">
        <BFormGroup label="Describe your Polly" label-for="description">
          <small>Just keep it simple, e.g. Ice skating 10/11/2025</small>
          <BFormInput
              id="description"
              v-model="description"
              :class="{ 'is-invalid': descriptionError }"
              type="text"
              maxlength="60"
              @input="resetDescriptionError"
            />
          <div class="invalid-feedback" v-if="descriptionError">{{ descriptionError }}</div>
        </BFormGroup>
        <BFormGroup v-if="NotificationService.isSupported()" class="mt-3">
          <BFormCheckbox v-model="enableNotifications" id="enable-notifications">
            <small>Enable notifications for this polly (you can change this later)</small>
          </BFormCheckbox>
        </BFormGroup>
        <BButton class="mt-3" type="submit" variant="primary">Create a Carpolly!</BButton>
      </BForm>
      <div class="mt-2">
        <small><a href="/faq">What in parrots name is this?!</a></small>
      </div>
      </BCard>

      <!-- Previous Pollys Card -->
      <BCard v-if="previousPollys.length > 0" class="mt-4" bg-variant="light">
        <template #header>
          <h5 class="mb-0">Your Previous Carpollies</h5>
        </template>
        <BListGroup>
          <BListGroupItem
            v-for="polly in previousPollys"
            :key="polly.id"
            button
            @click="navigateToPolly(polly.id)"
            class="d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{{ polly.description }}</strong>
              <br>
              <small class="text-muted">Created {{ formatDate(polly.created) }}</small>
            </div>
            <i class="bi bi-chevron-right"></i>
          </BListGroupItem>
        </BListGroup>
        <div class="mt-3">
          <BButton variant="outline-secondary" size="sm" @click="clearHistory">
            <i class="bi bi-trash"></i> Clear History
          </BButton>
        </div>
      </BCard>
    </BCol>
  </BRow>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'vue-router'
import { BForm, BFormGroup, BFormInput, BFormCheckbox, BButton, BCard, BCol, BRow, BListGroup, BListGroupItem, BBadge } from 'bootstrap-vue-next'
import { dataService } from '../services/dataService'
import { ValidationService } from '../services/validationService'
import { NotificationService } from '../services/notificationService'
import type { Polly } from '../models/polly.model'

const router = useRouter()
const description = ref('')
const descriptionError = ref('')
const enableNotifications = ref(false)
const previousPollys = ref<Array<{id: string, description: string, created: Date}>>([])

const resetDescriptionError = () => {
  descriptionError.value = ''
}

onMounted(() => {
  loadPreviousPollys()
})

const loadPreviousPollys = () => {
  try {
    const stored = localStorage.getItem('carpolly_created_pollies')
    if (stored) {
      const pollyIds = JSON.parse(stored) as string[]
      // Load pollys from dataService or create placeholder entries
      // For now, we'll create entries with basic info
      previousPollys.value = pollyIds.map(id => ({
        id,
        description: `Polly ${id.slice(0, 8)}...`, // Placeholder description
        created: new Date() // Placeholder date
      }))

      // Optionally fetch real data for each polly
      pollyIds.forEach(async (id) => {
        try {
          const pollyData = await dataService.getPolly(id)
          if (pollyData && pollyData.description && pollyData.created) {
            const index = previousPollys.value.findIndex(p => p.id === id)
            if (index !== -1) {
              previousPollys.value[index] = {
                id,
                description: pollyData.description,
                created: pollyData.created
              }
            }
          }
        } catch (error) {
          // Keep placeholder data if fetch fails
          console.warn(`Could not fetch polly ${id}:`, error)
        }
      })
    }
  } catch (error) {
    console.error('Error loading previous pollys:', error)
  }
}

const navigateToPolly = (pollyId: string) => {
  router.push(`/polly/${pollyId}`)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date))
}

const clearHistory = () => {
  if (confirm('Are you sure you want to clear your polly history?')) {
    localStorage.removeItem('carpolly_created_pollies')
    previousPollys.value = []
  }
}

const onSubmit = async () => {
  // Check rate limiting
  if (!ValidationService.checkRateLimit('createPolly', 3, 60000)) {
    ValidationService.showRateLimitModal('create polly', 3, 60000)
    return
  }

  // Comprehensive validation
  const validation = ValidationService.validatePollyDescription(description.value)

  descriptionError.value = validation.error || ''

  if (!validation.isValid) {
    return
  }

  const id = uuidv4()
  const polly: Polly = {
    description: description.value,
    drivers: [],
    created: new Date()
  }

  try {
    await dataService.createPolly(id, polly)

    // Store the polly ID in localStorage for history
    const existingPollys = JSON.parse(localStorage.getItem('carpolly_created_pollies') || '[]') as string[]
    if (!existingPollys.includes(id)) {
      existingPollys.unshift(id) // Add to beginning
      // Keep only last 10 pollys
      if (existingPollys.length > 10) {
        existingPollys.splice(10)
      }
      localStorage.setItem('carpolly_created_pollies', JSON.stringify(existingPollys))
    }

    // Enable notifications if requested
    if (enableNotifications.value) {
      await NotificationService.subscribeToPolly(id)
    }

    router.push(`/polly/${id}`)
  } catch (error) {
    console.log('Error creating polly:', error)
  }
}
</script>

<style scoped>
</style>
