<template>
  <BModal :model-value="modelValue" title="Join Driver" @ok="onSubmit($event)">
    <BForm>
      <BFormGroup label="Your Name:" label-for="consumerName">
        <BFormInput
          id="consumerName"
          v-model="consumerName"
          :class="{ 'is-invalid': nameError }"
          type="text"
          maxlength="60"
          required
          @input="resetNameError"
        />
        <div class="invalid-feedback" v-if="nameError">{{ nameError }}</div>
      </BFormGroup>
      <BFormGroup label="Comments (optional):" label-for="consumerComments">
        <BFormTextarea
          id="consumerComments"
          v-model="consumerComments"
          rows="3"
          maxlength="255"
        />
      </BFormGroup>
    </BForm>
  </BModal>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import { BModal, BForm, BFormGroup, BFormInput, BFormTextarea } from 'bootstrap-vue-next'
import { BvTriggerableEvent } from 'bootstrap-vue-next'
import { ValidationService } from '../services/validationService'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'consumer-added': [consumer: { name: string; comments: string }]
}>()

const consumerName = ref('')
const consumerComments = ref('')
const nameError = ref('')

const resetNameError = () => {
  nameError.value = ''
}

const onSubmit = async (event: BvTriggerableEvent) => {
  // Check rate limiting
  if (!ValidationService.checkRateLimit('addConsumer', 10, 60000)) {
    ValidationService.showRateLimitModal('add consumer', 10, 60000)
    event.preventDefault()
    return
  }

  // Comprehensive validation
  const validation = ValidationService.validateConsumerForm(consumerName.value, consumerComments.value)

  nameError.value = validation.errors.name || ''

  if (!validation.isValid) {
    event.preventDefault()
    return
  }

  emit('consumer-added', {
    name: consumerName.value,
    comments: consumerComments.value || ""
  })

  emit('update:modelValue', false)
  consumerName.value = ''
  consumerComments.value = ''
}
</script>

<style scoped></style>
