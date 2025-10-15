<template>
  <BRow class="justify-content-md-center">
    <BCol md="6">
      <BCard bg-variant="light" class="parrot-card">
      <BForm @submit.prevent="onSubmit">
        <BFormGroup label="Describe your Polly:" label-for="description">
          <BFormInput
            id="description"
            v-model="description"
            :class="{ 'is-invalid': descriptionError }"
            type="text"
            maxlength="60"
          />
          <div class="invalid-feedback" v-if="descriptionError">Description is required and must be 60 characters or less.</div>
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
import type { Polly } from '../models/polly.model'

const router = useRouter()
const description = ref('')
const descriptionError = ref(false)

const onSubmit = async () => {
  if (!description.value.trim() || description.value.length > 60) {
    descriptionError.value = true
    return
  }
  descriptionError.value = false

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
