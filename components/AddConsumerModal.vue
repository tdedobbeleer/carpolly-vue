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
        />
        <div class="invalid-feedback" v-if="nameError">Name is required and must be 60 characters or less.</div>
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

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'consumer-added': [consumer: { name: string; comments: string }]
}>()

const consumerName = ref('')
const consumerComments = ref('')
const nameError = ref(false)

const onSubmit = async (event: BvTriggerableEvent) => {
  if (!consumerName.value.trim() || consumerName.value.length > 60) {
    nameError.value = true
    event.preventDefault()
    return
  }
  nameError.value = false

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
