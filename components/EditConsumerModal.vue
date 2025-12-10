<template>
  <BModal ref="modal" title="Edit Driver" @ok="onSubmit($event)">
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
import { ref, defineProps, defineEmits, useTemplateRef, watch } from 'vue'
import { BModal, BForm, BFormGroup, BFormInput } from 'bootstrap-vue-next'
import type { BvTriggerableEvent } from 'bootstrap-vue-next'
import { dataService } from '../services/dataService'
import { ValidationService } from '../services/validationService'
import type { Driver } from '../models/driver.model'

const props = defineProps<{
  driver: Driver | null
  pollyId: string
}>()

const emit = defineEmits<{
  'driver-updated': []
}>()

const modal = useTemplateRef('modal')

const name = ref('')
const description = ref('')
const spots = ref(1)
const nameError = ref('')
const descriptionError = ref('')
const spotsError = ref('')

const resetNameError = () => {
  nameError.value = ''
}

const resetDescriptionError = () => {
  descriptionError.value = ''
}

const resetSpotsError = () => {
  spotsError.value = ''
}

// Watch for driver prop changes to populate form
watch(() => props.driver, (newDriver) => {
  if (newDriver) {
    name.value = newDriver.name || ''
    description.value = newDriver.description || ''
    spots.value = newDriver.spots || 1
  }
}, { immediate: true })

const onSubmit = async (event: BvTriggerableEvent) => {
  if (!props.driver || !props.driver.id) {
    event.preventDefault()
    return
  }

  // Check rate limiting
  if (!ValidationService.checkRateLimit('updateDriver', 5, 60000)) {
    ValidationService.showRateLimitModal('update driver', 5, 60000)
    event.preventDefault()
    return
  }

  // Comprehensive validation
  const currentConsumersCount = props.driver.consumers?.length || 0
  const validation = ValidationService.validateDriverUpdateForm(name.value, description.value, spots.value, currentConsumersCount)

  nameError.value = validation.errors.name || ''
  descriptionError.value = validation.errors.description || ''
  spotsError.value = validation.errors.spots || ''

  if (!validation.isValid) {
    event.preventDefault()
    return
  }

  const updatedDriver: Partial<Driver> = {
    name: name.value,
    description: description.value,
    spots: spots.value
  }

  try {
    await dataService.updateDriver(props.pollyId, props.driver.id, updatedDriver)
    emit('driver-updated')
    modal.value?.hide()
  } catch (error) {
    console.error('Error updating driver:', error)
    event.preventDefault()
  }
}

defineExpose({
  show: () => modal.value?.show()
})
</script>

<style scoped></style>
