<template>
  <BModal
    v-model="showModal"
    title="Push Notifications"
    @ok="handleSave"
    @cancel="handleCancel"
    ok-title="Save"
    cancel-title="Cancel"
  >
    <div class="text-center">
      <i :class="`bi bi-bell${enableNotifications ? '-fill' : ''} text-primary fs-1 mb-3`"></i>
      <h5>{{ modalType === 'polly' ? 'Push Notifications' : 'Driver Notifications' }}</h5>
      <p v-if="modalType === 'polly'">
        Get notified when drivers or passengers join "{{ pollyDescription }}"
      </p>
      <p v-else>
        Get notified when passengers join or leave your ride with "{{ driverName }}"
      </p>
      <div class="form-check form-switch mb-3">
        <input
          class="form-check-input"
          type="checkbox"
          id="notification-toggle"
          v-model="enableNotifications"
        >
        <label class="form-check-label" for="notification-toggle">
          {{ modalType === 'polly' ? 'Enable notifications for this polly' : 'Enable notifications for passenger changes' }}
        </label>
      </div>
    </div>
  </BModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { BModal } from 'bootstrap-vue-next'
import { NotificationService } from '../services/notificationService'

interface Props {
  modelValue: boolean
  modalType: 'polly' | 'driver'
  pollyId?: string
  pollyDescription?: string
  driverId?: string
  driverName?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showModal = ref(false)
const enableNotifications = ref(false)

watch(() => props.modelValue, async (newValue) => {
  showModal.value = newValue
  if (newValue) {
    // Initialize checkbox state when modal opens
    if (props.modalType === 'polly' && props.pollyId) {
      enableNotifications.value = await NotificationService.isSubscribedToPolly(props.pollyId)
    } else if (props.modalType === 'driver' && props.driverId) {
      enableNotifications.value = await NotificationService.isSubscribedToDriverPassengers(props.driverId)
    }
  }
})

watch(showModal, (newValue) => {
  emit('update:modelValue', newValue)
})

const handleSave = async () => {
  try {
    let success = false

    if (props.modalType === 'polly' && props.pollyId) {
      if (enableNotifications.value) {
        success = await NotificationService.subscribeToPolly(props.pollyId)
        if (success) {
          alert('Notifications enabled! You\'ll be notified of changes to this polly.')
        } else {
          alert('Failed to enable notifications. Please check your browser settings.')
        }
      } else {
        NotificationService.unsubscribeFromPolly(props.pollyId)
        alert('Notifications disabled for this polly.')
      }
    } else if (props.modalType === 'driver' && props.driverId) {
      if (enableNotifications.value) {
        success = await NotificationService.subscribeToDriverPassengers(props.driverId)
        if (success) {
          alert('Driver notifications enabled! You\'ll be notified of passenger changes.')
        } else {
          alert('Failed to enable notifications. Please check your browser settings.')
        }
      } else {
        NotificationService.unsubscribeFromDriverPassengers(props.driverId)
        alert('Driver notifications disabled.')
      }
    }

    emit('saved')
    showModal.value = false
  } catch (error) {
    console.error('Error saving notification settings:', error)
    alert('Error saving notification settings.')
  }
}

const handleCancel = () => {
  showModal.value = false
}
</script>

<style scoped>
</style>
