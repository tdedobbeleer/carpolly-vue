<template>
  <div class="row justify-content-md-center">
    <div class="col col-md-6">
      <BForm @submit.prevent="onSubmit">
        <BFormGroup label="Describe your Polly:" label-for="description">
          <BFormInput
            id="description"
            v-model="description"
            type="text"
          />
        </BFormGroup>
        <BAlert class="p-1" v-if="descriptionError" variant="danger" show>
          Description is required.
        </BAlert>
        <BButton class="p-2" type="submit" variant="primary">Create a Carpolly!</BButton>
      </BForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'vue-router'
import { BForm, BFormGroup, BFormInput, BAlert, BButton } from 'bootstrap-vue-next'
import { dataService } from '../services/dataService'
import type { Polly } from '../models/polly.model'

const router = useRouter()
const description = ref('')
const descriptionError = ref(false)

const onSubmit = async () => {
  if (!description.value.trim()) {
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
/* Add styles if needed */
</style>