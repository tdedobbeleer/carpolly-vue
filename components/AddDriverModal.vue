<template>
  <BModal :model-value="modelValue" title="Add Driver" @ok="onSubmit">
    <BForm>
      <BFormGroup label="Whats your name??" label-for="name">
        <BFormInput
          id="name"
          v-model="name"
          type="text"
        />
      </BFormGroup>
      <BAlert v-if="nameError" variant="danger" show>
        Name is required.
      </BAlert>

      <BFormGroup label="Where do you want to meet? At what Time?" label-for="description">
        <BFormInput
          id="description"
          v-model="description"
          type="text"
        />
      </BFormGroup>
      <BAlert v-if="descriptionError" variant="danger" show>
        Description is required.
      </BAlert>

      <BFormGroup label="Available spots?" label-for="spots">
        <BFormInput
          id="spots"
          v-model.number="spots"
          type="number"
        />
      </BFormGroup>
      <BAlert v-if="spotsError" variant="danger" show>
        Spots is required and must be at least 1.
      </BAlert>
    </BForm>
  </BModal>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import { BModal, BForm, BFormGroup, BFormInput, BAlert } from 'bootstrap-vue-next'
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

const onSubmit = async () => {
  nameError.value = !name.value.trim()
  descriptionError.value = !description.value.trim()
  spotsError.value = spots.value < 1

  if (nameError.value || descriptionError.value || spotsError.value) {
    return
  }

  const driver: Driver = {
    name: name.value,
    description: description.value,
    spots: spots.value,
    consumers: []
  }

  if (props.polly) {
    props.polly.drivers = props.polly.drivers || []
    props.polly.drivers.push(driver)
    try {
      await dataService.updatePolly(props.id, { drivers: props.polly.drivers })
      emit('driver-added')
      emit('update:modelValue', false)
    } catch (error) {
      console.error('Error adding driver:', error)
    }
  }
}
</script>

<style scoped></style>