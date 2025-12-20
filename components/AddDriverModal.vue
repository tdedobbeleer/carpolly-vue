<template>
  <BModal ref="modal" title="Add Driver" @ok="onSubmit($event)" @shown="prefillFormFields">
    <BForm>
      <BFormGroup label="Who will drive?" label-for="name">
        <BFormInput
          id="name"
          v-model="name"
          :class="{ 'is-invalid': nameError }"
          type="text"
          maxlength="60"
          @input="resetNameError"
        />
        <div v-if="nameError" class="invalid-feedback">
          {{ nameError }}
        </div>
      </BFormGroup>

      <BFormGroup label="Where will you wait with your car? At what Time?" label-for="description">
        <BFormInput
          id="description"
          v-model="description"
          :class="{ 'is-invalid': descriptionError }"
          type="text"
          maxlength="255"
          @input="resetDescriptionError"
        />
        <div v-if="descriptionError" class="invalid-feedback">
          {{ descriptionError }}
        </div>
      </BFormGroup>

      <BFormGroup label="Available spots?" label-for="spots">
        <BFormInput
          id="spots"
          v-model.number="spots"
          :class="{ 'is-invalid': spotsError }"
          type="number"
          @input="resetSpotsError"
        />
        <div v-if="spotsError" class="invalid-feedback">
          {{ spotsError }}
        </div>
      </BFormGroup>
    </BForm>
  </BModal>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { BModal, BForm, BFormGroup, BFormInput } from 'bootstrap-vue-next'
import type { BvTriggerableEvent } from 'bootstrap-vue-next'
import { dataService } from '../services/dataService'
import { ValidationService } from '../services/validationService'
import { useUserProfile } from '../src/composables/useUserProfile'
import { useDriverDefaults } from '../src/composables/useDriverDefaults'
import type { Polly } from '../models/polly.model'
import type { Driver } from '../models/driver.model'

const props = defineProps<{
  polly: Polly | null
  id: string
}>()

const emit = defineEmits<{
  'driver-added': []
}>()

const modal = useTemplateRef('modal')

const name = ref('')
const description = ref('')
const spots = ref(1)
const nameError = ref('')
const descriptionError = ref('')
const spotsError = ref('')

// Use the user profile and driver defaults composables
const { userProfile } = useUserProfile()
const { driverDefaults } = useDriverDefaults()

// Pre-fill form fields when modal opens
const prefillFormFields = () => {
  // Pre-fill name from user profile if available
  if (userProfile.value.name && !name.value) {
    name.value = userProfile.value.name
  }

  // Pre-fill description from driver defaults if available
  if (driverDefaults.value.description && !description.value) {
    description.value = driverDefaults.value.description
  }

  // Pre-fill spots from driver defaults if available
  if (driverDefaults.value.spots && spots.value === 1) {
    spots.value = driverDefaults.value.spots
  }
}



const resetNameError = () => {
  nameError.value = ''
}

const resetDescriptionError = () => {
  descriptionError.value = ''
}

const resetSpotsError = () => {
  spotsError.value = ''
}

const onSubmit = async (event: BvTriggerableEvent) => {
  // Check rate limiting
  if (!ValidationService.checkRateLimit('createDriver', 5, 60000)) {
    ValidationService.showRateLimitModal('create driver', 5, 60000)
    event.preventDefault()
    return
  }

  // Comprehensive validation
  const validation = ValidationService.validateDriverForm(name.value, description.value, spots.value)

  nameError.value = validation.errors.name || ''
  descriptionError.value = validation.errors.description || ''
  spotsError.value = validation.errors.spots || ''

  if (!validation.isValid) {
    event.preventDefault()
    return
  }

  const driver: Driver = {
    name: name.value,
    description: description.value,
    spots: spots.value,
    consumers: []
  }

  try {
    await dataService.createDriver(props.id, driver)
    // Reset form fields
    name.value = ''
    description.value = ''
    spots.value = 0
    nameError.value = ''
    descriptionError.value = ''
    spotsError.value = ''
    emit('driver-added')
    modal.value?.hide()
  } catch (error) {
    console.error('Error adding driver:', error)
    event.preventDefault()
  }
}

defineExpose({
  show: () => modal.value?.show()
})
</script>

<style scoped></style>
