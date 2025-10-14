<template>
  <BModal :model-value="modelValue" title="Add Driver" @ok="onSubmit($event)">
    <BForm>
      <BFormGroup label="Who will drive?" label-for="name">
        <BFormInput
          id="name"
          v-model="name"
          :class="{ 'is-invalid': nameError }"
          type="text"
        />
        <div v-if="nameError" class="invalid-feedback">
          Name is required.
        </div>
      </BFormGroup>

      <BFormGroup label="Where do you want to meet? At what Time?" label-for="description">
        <BFormInput
          id="description"
          v-model="description"
          :class="{ 'is-invalid': descriptionError }"
          type="text"
        />
        <div v-if="descriptionError" class="invalid-feedback">
          Description is required.
        </div>
      </BFormGroup>

      <BFormGroup label="Available spots?" label-for="spots">
        <BFormInput
          id="spots"
          v-model.number="spots"
          :class="{ 'is-invalid': spotsError }"
          type="number"
        />
        <div v-if="spotsError" class="invalid-feedback">
          Spots is required and must be at least 1.
        </div>
      </BFormGroup>
    </BForm>
  </BModal>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import { BModal, BForm, BFormGroup, BFormInput } from 'bootstrap-vue-next'
import type { BvTriggerableEvent } from 'bootstrap-vue-next'
import { dataService } from '../services/dataService'
import type { Polly } from '../models/polly.model'
import type { Driver } from '../models/driver.model'

const props = defineProps<{
  modelValue: boolean
  polly: Polly | null
  id: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'driver-added': []
}>()

const name = ref('')
const description = ref('')
const spots = ref(0)
const nameError = ref(false)
const descriptionError = ref(false)
const spotsError = ref(false)

const onSubmit = async (event: BvTriggerableEvent) => {
  nameError.value = !name.value.trim()
  descriptionError.value = !description.value.trim()
  spotsError.value = spots.value < 1

  if (nameError.value || descriptionError.value || spotsError.value) {
    event.preventDefault()
    return
  }

  const driver: Driver = {
    name: name.value,
    description: description.value,
    spots: spots.value,
    consumers: []
  }

  if (props.polly) {
    const updatedDrivers = [...(props.polly.drivers || []), driver]
    try {
      await dataService.updatePolly(props.id, { drivers: updatedDrivers })
      emit('driver-added')
      emit('update:modelValue', false)
    } catch (error) {
      console.error('Error adding driver:', error)
      event.preventDefault()
    }
  }
}
</script>

<style scoped></style>
