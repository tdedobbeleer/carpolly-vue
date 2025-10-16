<template>
  <BRow class="justify-content-md-center">
    <BCol md="6">
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
        <BButton class="mt-3" type="submit" variant="primary">Create a Carpolly!</BButton>
      </BForm>
      </BCard>
    </BCol>
  </BRow>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'vue-router'
import { BForm, BFormGroup, BFormInput, BButton, BCard, BCol, BRow } from 'bootstrap-vue-next'
import { dataService } from '../services/dataService'
import { ValidationService } from '../services/validationService'
import type { Polly } from '../models/polly.model'

const router = useRouter()
const description = ref('')
const descriptionError = ref('')

const resetDescriptionError = () => {
  descriptionError.value = ''
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
    router.push(`/polly/${id}`)
  } catch (error) {
    console.log('Error creating polly:', error)
  }
}
</script>

<style scoped>
</style>
