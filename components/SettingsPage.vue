<template>
  <div class="settings-page">
    <BRow class="justify-content-md-center">
      <BCol md="8">
            <h1 class="text-center mb-4">
              <i class="bi bi-gear-fill me-2"></i>
            Settings
          </h1>
        <BCard class="shadow">
          <BCardBody>
            <!-- Section 1: User Profile -->
            <div class="mb-5">
              <h3 class="mb-4 text-primary">
                <i class="bi bi-person-circle me-2"></i>
                User Profile
              </h3>

              <div class="mb-4">
                <label for="user-name" class="form-label fw-bold">Your Name</label>
                <BFormInput
                  id="user-name"
                  v-model="localName"
                  type="text"
                  maxlength="50"
                  placeholder="Enter your name"
                  :class="{ 'is-invalid': nameError }"
                />
                <div v-if="nameError" class="invalid-feedback">
                  {{ nameError }}
                </div>
                <div class="form-text">
                  This name will be used when you join pollies as a passenger or driver.
                </div>
              </div>

              <div class="d-flex align-items-center">
                <div v-if="saveMessage" class="me-3">
                  <small :class="saveMessage.type === 'success' ? 'text-success' : 'text-danger'">
                    <i :class="saveMessage.type === 'success' ? 'bi bi-check-circle' : 'bi bi-exclamation-triangle'"></i>
                    {{ saveMessage.text }}
                  </small>
                </div>
                <BButton class="ms-auto" @click="saveUserProfile" variant="primary">
                  <i class="bi bi-check-circle me-1"></i>
                  Save Profile
                </BButton>
              </div>
            </div>

            <!-- Section 2: Driver Defaults -->
            <div class="mb-5">
              <h3 class="mb-4 text-warning">
                <i class="bi bi-car-front me-2"></i>
                Driver Defaults
              </h3>

              <div class="mb-4 text-muted">
                These defaults will be pre-filled when you offer to drive in pollies.
              </div>

              <div class="mb-4">
                <label for="driver-description" class="form-label fw-bold">Default Description</label>
                <BFormInput
                  id="driver-description"
                  v-model="localDescription"
                  type="text"
                  maxlength="255"
                  placeholder="Where will you wait with your car? At what time?"
                  :class="{ 'is-invalid': descriptionError }"
                />
                <div v-if="descriptionError" class="invalid-feedback">
                  {{ descriptionError }}
                </div>
              </div>

              <div class="mb-4">
                <label for="driver-spots" class="form-label fw-bold">Default Spots</label>
                <BFormInput
                  id="driver-spots"
                  v-model.number="localSpots"
                  type="number"
                  min="1"
                  max="50"
                  placeholder="1"
                  :class="{ 'is-invalid': spotsError }"
                />
                <div v-if="spotsError" class="invalid-feedback">
                  {{ spotsError }}
                </div>
              </div>

              <div class="d-flex align-items-center">
                <div v-if="driverSaveMessage" class="me-3">
                  <small :class="driverSaveMessage.type === 'success' ? 'text-success' : 'text-danger'">
                    <i :class="driverSaveMessage.type === 'success' ? 'bi bi-check-circle' : 'bi bi-exclamation-triangle'"></i>
                    {{ driverSaveMessage.text }}
                  </small>
                </div>
                <BButton class="ms-auto" @click="saveDriverDefaults" variant="warning">
                  <i class="bi bi-car-front me-1"></i>
                  Save Driver Defaults
                </BButton>
              </div>
            </div>

            <!-- Section 3: Notifications -->
            <div class="mb-5">
              <h3 class="mb-4 text-danger">
                <i class="bi bi-bell-slash me-2"></i>
                Notifications
              </h3>

              <div class="mb-4 text-muted">
                Reset all notification settings to stop receiving notifications for any polly changes.
                This will clear all saved notification preferences for all pollies.
              </div>

              <div class="d-flex align-items-center">
                <div v-if="notificationResetMessage" class="me-3">
                  <small :class="notificationResetMessage.type === 'success' ? 'text-success' : 'text-danger'">
                    <i :class="notificationResetMessage.type === 'success' ? 'bi bi-check-circle' : 'bi bi-exclamation-triangle'"></i>
                    {{ notificationResetMessage.text }}
                  </small>
                </div>
                <BButton class="ms-auto" @click="handleClearNotifications" variant="danger">
                  <i class="bi bi-bell-slash me-1"></i>
                  Clear All Notifications
                </BButton>
              </div>
            </div>
          </BCardBody>
        </BCard>
      </BCol>
    </BRow>

    <!-- Clear Notifications Confirmation Modal -->
    <BModal
      v-model="showClearNotificationsModal"
      title="Clear All Notifications"
      @ok="clearAllNotifications"
      ok-variant="danger"
      ok-title="Clear All Notifications"
      cancel-title="Cancel"
    >
      <p class="text-danger">
        <strong>Warning:</strong> This will remove all notification settings for all pollies.
        You will no longer receive notifications for any polly changes. This action cannot be undone.
      </p>
      <p>Are you sure you want to clear all notification settings?</p>
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  BRow,
  BCol,
  BCard,
  BCardBody,
  BFormInput,
  BButton,
  BModal
} from 'bootstrap-vue-next'
import { useUserProfile } from '../src/composables/useUserProfile'
import { useDriverDefaults } from '../src/composables/useDriverDefaults'
import { ValidationService } from '../services/validationService'

// Use the user profile composable
const { userProfile, updateName } = useUserProfile()

// Use the driver defaults composable
const { driverDefaults, updateDescription, updateSpots } = useDriverDefaults()

// Local reactive variables for the input fields
const localName = ref('')
const localDescription = ref('')
const localSpots = ref(1)

// Sync local name with composable when it changes
watch(
  userProfile,
  (newProfile: { name: string }) => {
    localName.value = newProfile.name
  },
  { immediate: true }
)

// Sync local driver defaults with composable when they change
watch(
  driverDefaults,
  (newDefaults: { description: string; spots: number }) => {
    localDescription.value = newDefaults.description
    localSpots.value = newDefaults.spots
  },
  { immediate: true }
)

// UI state
const nameError = ref('')
const saveMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const descriptionError = ref('')
const spotsError = ref('')
const driverSaveMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const notificationResetMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const showClearNotificationsModal = ref(false)


// Save user profile with validation
const saveUserProfile = () => {
  try {
    // Clear previous messages
    nameError.value = ''
    saveMessage.value = null

    // Validate name using the same logic as consumer validation
    const validation = ValidationService.validateOptionalName(localName.value)

    if (!validation.isValid) {
      nameError.value = validation.error || 'Invalid name'
      saveMessage.value = {
        type: 'error',
        text: 'Please fix the errors and try again'
      }
      return
    }

    // Clear any validation errors
    nameError.value = ''

    // Actually save the name using the composable method
    updateName(localName.value)

    // Show success message
    saveMessage.value = {
      type: 'success',
      text: 'Profile saved successfully!'
    }

    // Clear success message after 3 seconds
    setTimeout(() => {
      saveMessage.value = null
    }, 3000)
  } catch (error) {
    console.error('Error saving user profile:', error)
    saveMessage.value = {
      type: 'error',
      text: 'An error occurred while saving. Please try again.'
    }
  }
}

// Save driver defaults with validation
const saveDriverDefaults = () => {
  try {
    // Clear previous messages
    descriptionError.value = ''
    spotsError.value = ''
    driverSaveMessage.value = null

    // Validate using the same logic as driver creation
    const validation = ValidationService.validateDriverForm('Driver', localDescription.value, localSpots.value)

    descriptionError.value = validation.errors.description || ''
    spotsError.value = validation.errors.spots || ''

    if (!validation.isValid) {
      driverSaveMessage.value = {
        type: 'error',
        text: 'Please fix the errors and try again'
      }
      return
    }

    // Clear any validation errors
    descriptionError.value = ''
    spotsError.value = ''

    // Actually save the defaults using the composable methods
    updateDescription(localDescription.value)
    updateSpots(localSpots.value)

    // Show success message
    driverSaveMessage.value = {
      type: 'success',
      text: 'Driver defaults saved successfully!'
    }

    // Clear success message after 3 seconds
    setTimeout(() => {
      driverSaveMessage.value = null
    }, 3000)
  } catch (error) {
    console.error('Error saving driver defaults:', error)
    driverSaveMessage.value = {
      type: 'error',
      text: 'An error occurred while saving. Please try again.'
    }
  }
}

// Handle clear notifications
const handleClearNotifications = () => {
  showClearNotificationsModal.value = true
}

// Clear all notification settings
const clearAllNotifications = () => {
  try {
    // Clear notification-related localStorage items
    const notificationKeys = Object.keys(localStorage).filter(key =>
      key.includes('notification') ||
      key.includes('firebase') ||
      key.includes('push')
    )

    notificationKeys.forEach(key => {
      localStorage.removeItem(key)
    })

    notificationResetMessage.value = {
      type: 'success',
      text: 'All notification settings cleared successfully!'
    }

    // Clear success message after 3 seconds
    setTimeout(() => {
      notificationResetMessage.value = null
    }, 3000)
  } catch (error) {
    console.error('Error clearing notifications:', error)
    notificationResetMessage.value = {
      type: 'error',
      text: 'An error occurred while clearing notifications. Please try again.'
    }
  }
}

// Load data when component mounts
onMounted(() => {
  // Component mounted successfully
})
</script>

<style scoped>
.settings-page {
  padding: 2rem 0;
}

.settings-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.5rem;
  padding: 1.5rem 0;
  margin-bottom: 2rem;
}

.settings-header h2 {
  color: white;
  margin: 0;
}

.card {
  border: none;
  border-radius: 0.5rem;
}

.form-check-input:checked {
  background-color: #28a745;
  border-color: #28a745;
}

.form-select:focus,
.form-check-input:focus,
.form-control:focus {
  border-color: #28a745;
  box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}

.btn-outline-primary:hover {
  background-color: #28a745;
  border-color: #28a745;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-warning:hover {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  border-color: #dc3545;
}

.btn-warning {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}

.btn-warning:hover {
  background-color: #e0a800;
  border-color: #d39e00;
  color: #212529;
}

.text-muted {
  font-size: 0.875rem;
}

h3 {
  color: #495057;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.5rem;
}

h3.text-primary {
  color: #0d6efd !important;
  border-bottom-color: #0d6efd;
}

h3.text-success {
  color: #198754 !important;
  border-bottom-color: #198754;
}

h3.text-info {
  color: #0dcaf0 !important;
  border-bottom-color: #0dcaf0;
}

h3.text-warning {
  color: #ffc107 !important;
  border-bottom-color: #ffc107;
}

h3.text-danger {
  color: #dc3545 !important;
  border-bottom-color: #dc3545;
}

@media (max-width: 768px) {
  .settings-page {
    padding: 1rem 0;
  }

  .settings-header {
    padding: 1rem 0;
    margin-bottom: 1rem;
  }

  .card-body {
    padding: 1rem;
  }
}
</style>
