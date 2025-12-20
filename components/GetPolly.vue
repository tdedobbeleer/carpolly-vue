<template>
  <BRow class="justify-content-md-center">
    <BCol md="8">
      <div v-if="isLoading" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else-if="!polly" class="text-center my-5">
        <div class="alert alert-warning" role="alert">
          <i class="bi bi-exclamation-triangle"></i>
          Polly not found! It doesn't exist or may have been deleted.
        </div>
      </div>
      <div v-else>
        <BRow align-items="center" class="mb-2">
          <BCol xs="6">
            <div
              class="editable-title-container d-flex align-items-center"
              @mouseenter="showEditIcon = true"
              @mouseleave="showEditIcon = false"
            >
              <h1
                v-if="!isEditingTitle"
                @click="startEditingTitle"
                class="editable-title"
              >
                {{ polly?.description }}
              </h1>
              <div v-else class="d-flex align-items-center">
                <input
                  ref="titleInput"
                  v-model="editingTitle"
                  @keyup.enter="saveTitle"
                  @keyup.escape="cancelEditingTitle"
                  @input="resetTitleError"
                  :class="{
                    'form-control': true,
                    'form-control-lg': true,
                    'me-2': true,
                    'is-invalid': titleError
                  }"
                  type="text"
                  maxlength="60"
                  required
                />
                <div v-if="titleError" class="invalid-feedback d-block">
                  {{ titleError }}
                </div>
                <BButton
                  @click="saveTitle"
                  variant="success"
                  size="sm"
                  class="d-block d-md-none"
                >
                  <i class="bi bi-check"></i>
                </BButton>
              </div>
              <i
                v-if="!isEditingTitle && showEditIcon"
                class="bi bi-pencil edit-icon ms-2"
                title="Edit title"
              ></i>
            </div>
          </BCol>
        </BRow>

        <BRow>
          <BCol xs="6">
            <div class="d-flex gap-2">
              <BButton
                size="sm"
                variant="outline-primary"
                @click="shareOnWhatsApp"
                title="Share on WhatsApp"
              >
                <i class="bi bi-whatsapp"></i>
              </BButton>
              <BButton
                size="sm"
                variant="outline-primary"
                @click="shareOnTelegram"
                title="Share on Telegram"
              >
                <i class="bi bi-telegram"></i>
              </BButton>
              <BButton
                size="sm"
                variant="outline-primary"
                @click="shareOnSignal"
                title="Share on Signal"
              >
                Signal
              </BButton>
              <BButton
                size="sm"
                variant="outline-primary"
                @click="shareViaSMS"
                title="Share via SMS"
              >
                <i class="bi bi-chat-dots"></i>
              </BButton>
            </div>
          </BCol>
          <BCol xs="6" class="text-end">
            <BButton
              v-if="NotificationService.isSupported()"
              size="sm"
              variant="outline-primary"
              @click="showNotificationSettings"
              title="Notification settings"
              class="position-relative"
            >
              <i class="bi bi-bell"></i>
              <BBadge
                v-if="isSubscribedToPolly"
                dot-indicator
                variant="success"
                class="position-absolute top-0 start-100 translate-middle"
              />
            </BButton>
          </BCol>
        </BRow>

        <!-- Waiting List Section -->
        <BRow v-if="!isLoading && polly?.consumers?.length">
          <div class="d-flex m-3">
            <h3>Waiting list</h3>
          </div>

          <BCol md="6" offset-md="3">
            <div class="list-group">
              <DraggablePassenger
                v-for="(consumer, index) in polly.consumers"
                :key="consumer.id || index"
                :passenger="{
                  id: consumer.id,
                  name: consumer.name || '',
                  comments: consumer.comments
                }"
                :passenger-index="index"
                :expanded="expandedWaitingListItems.has(index)"
                @toggle-comments="toggleWaitingListExpanded"
                @remove="confirmRemoveWaitingListConsumer"
                @drag-start="onPassengerDragStart"
                @drag-end="onPassengerDragEnd"
              />
            </div>
          </BCol>
        </BRow>

        <!-- Drivers Section -->
        <BRow>
          <div class="d-flex m-3">
            <h2>Drivers and spots available</h2>
            <BButton class="ms-auto" @click="addDriverModal?.show()">
              I'm a driver! <span class="bi bi-car-front-fill"></span>
            </BButton>
            <BButton
              v-if="canJoinWaitingList"
              @click="openWaitingListJoinModal"
              class="ms-2"
              variant="outline-primary"
            >
              I'm a passenger! <i class="bi bi-person-walking"></i>
            </BButton>
          </div>
        </BRow>

        <BRow v-if="!polly?.drivers?.length">
          <BCol class="mb-3" md="6" offset-md="3">
            <BCard class="border-info shadow text-center parrot-card">
              <p>
                No drivers yet! Be a good parrot and offer a ride
                <i class="bi bi-emoji-smile-upside-down"></i>
              </p>
            </BCard>
          </BCol>
        </BRow>

        <BRow v-else class="row-cols-1 row-cols-md-2 g-4">
          <BCol
            class="car-bcol"
            v-for="(driver, index) in polly?.drivers"
            :key="index"
          >
            <DroppableDriver
              :driver="driver"
              :driver-index="index"
              :is-updating="updatingDrivers.has(index)"
              :expanded-consumer-items="expandedItems.get(index) || new Set()"
              :driver-subscriptions="driverSubscriptions"
              @edit-driver="openEditDriverModal"
              @join-driver="openJoinModal"
              @remove-driver="confirmRemove"
              @remove-consumer="confirmRemoveConsumer"
              @toggle-consumer-comments="toggleExpanded"
              @driver-notifications="showDriverNotificationSettings"
              @passenger-dropped="onPassengerDropped"
            />
          </BCol>
        </BRow>
      </div>
    </BCol>

    <!-- Modals -->
    <AddDriverModal
      ref="addDriverModal"
      :polly="polly"
      :id="id"
      @driver-added="onDriverAdded"
    />

    <BModal v-model="showRemoveModal" title="Confirm Removal" @ok="removeDriver">
      <p>Are you sure you want to remove this driver?</p>
    </BModal>

    <BModal
      v-model="showRemoveConsumerModal"
      title="Confirm Removal"
      @ok="removeConsumer"
    >
      <p>Are you sure you want to remove this passenger?</p>
    </BModal>

    <BModal
      v-model="showRemoveWaitingListConsumerModal"
      title="Confirm Removal"
      @ok="removeWaitingListConsumer"
    >
      <p>
        Are you sure you want to remove this passenger from the waiting list?
      </p>
    </BModal>

    <AddConsumerModal
      v-model="showJoinModal"
      :mode="joinMode"
      @consumer-added="onConsumerAdded"
    />

    <EditConsumerModal
      ref="editConsumerModal"
      :driver="currentEditingDriver"
      :polly-id="id"
      @driver-updated="onDriverUpdated"
    />

    <NotificationSettingsModal
      v-model="showNotificationModal"
      :modal-type="notificationModalType"
      :polly-id="id"
      :polly-description="notificationModalType === 'polly' ? polly?.description : undefined"
      :driver-id="notificationModalType === 'driver' ? currentDriverId : undefined"
      :driver-name="notificationModalType === 'driver' ? currentDriverName : undefined"
      @saved="onNotificationSaved"
    />
  </BRow>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  nextTick,
  useTemplateRef,
  watchEffect,
  computed
} from 'vue'
import { useRoute } from 'vue-router'
import {
  BButton,
  BModal,
  BCol,
  BRow,
  BBadge,
  BCard
} from 'bootstrap-vue-next'
import AddDriverModal from './AddDriverModal.vue'
import AddConsumerModal from './AddConsumerModal.vue'
import EditConsumerModal from './EditConsumerModal.vue'
import NotificationSettingsModal from './NotificationSettingsModal.vue'
import DraggablePassenger from './DraggablePassenger.vue'
import DroppableDriver from './DroppableDriver.vue'
import { dataService } from '../services/dataService'
import { ValidationService } from '../services/validationService'
import { NotificationService } from '../services/notificationService'
import type { Polly } from '../models/polly.model'
import type { Driver } from '../models/driver.model'

const route = useRoute()
const id = ref(route.params.id as string)
const polly = ref<Polly | null>(null)
const isLoading = ref(true)
const showRemoveModal = ref(false)
const driverIndex = ref(-1)
const showRemoveConsumerModal = ref(false)
const consumerIndex = ref(-1)
const showJoinModal = ref(false)
const joinDriverIndex = ref(-1)
const expandedItems = ref<Map<number, Set<number>>>(new Map())
const unsubscribe = ref<(() => void) | null>(null)
const isEditingTitle = ref(false)
const editingTitle = ref('')
const showEditIcon = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)
const titleError = ref('')
const addDriverModal = useTemplateRef('addDriverModal')
const editConsumerModal = useTemplateRef('editConsumerModal')
const updatingDrivers = ref<Set<number>>(new Set())
const showNotificationModal = ref(false)
const notificationModalType = ref<'polly' | 'driver'>('polly')
const currentDriverId = ref('')
const currentDriverName = ref('')
const currentEditingDriver = ref<Driver | null>(null)

const expandedWaitingListItems = ref<Set<number>>(new Set())

const showRemoveWaitingListConsumerModal = ref(false)

const waitingListConsumerIndex = ref(-1)

const joinMode = ref<'driver' | 'waitingList'>('driver')

const canJoinWaitingList = computed(
  () =>
    !polly.value?.drivers?.length ||
    polly.value.drivers.every(
      (d) => (d.consumers?.length || 0) >= (d.spots || 0)
    )
)

// Reactive notification states
const notificationState = ref(0)

// Reactive notification states
const isSubscribedToPolly = ref(false)
const driverSubscriptions = ref<Record<string, boolean>>({})

// Load initial subscription states
const loadSubscriptionStates = async () => {
  isSubscribedToPolly.value = await NotificationService.isSubscribedToPolly(
    id.value
  )

  // Load driver subscriptions for current drivers
  if (polly.value?.drivers) {
    for (const driver of polly.value.drivers) {
      if (driver.id) {
        driverSubscriptions.value[driver.id] =
          await NotificationService.isSubscribedToDriverPassengers(
            id.value,
            driver.id
          )
      }
    }
  }
}

// Watch for notification state changes and reload
watchEffect(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  notificationState.value // trigger reactivity
  await loadSubscriptionStates()
})

const resetTitleError = () => {
  titleError.value = ''
}

onMounted(() => {
  unsubscribe.value = dataService.subscribeToPolly(id.value, (data) => {
    polly.value = data
    isLoading.value = false
    loadSubscriptionStates()
  })

  // Subscribe to notification changes
  const unsubscribeNotifications = NotificationService.onSubscriptionChange(
    () => {
      notificationState.value++
    }
  )

  // Cleanup function for notifications
  const originalUnsubscribe = unsubscribe.value
  unsubscribe.value = () => {
    originalUnsubscribe?.()
    unsubscribeNotifications()
  }
})

onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value()
  }
})

const onDriverAdded = () => {
  // Modal is now controlled by useTemplateRef, no need to set showModal
}

const openEditDriverModal = (driver: Driver) => {
  currentEditingDriver.value = driver
  editConsumerModal.value?.show()
}

const onDriverUpdated = () => {
  currentEditingDriver.value = null
}

const confirmRemove = (index: number) => {
  driverIndex.value = index
  showRemoveModal.value = true
}

const confirmRemoveConsumer = (driverIdx: number, consIdx: number) => {
  driverIndex.value = driverIdx
  consumerIndex.value = consIdx
  showRemoveConsumerModal.value = true
}

const removeDriver = async () => {
  if (polly.value && driverIndex.value >= 0 && polly.value.drivers) {
    const driverToRemove = polly.value.drivers[driverIndex.value]
    if (driverToRemove && driverToRemove.id) {
      try {
        await dataService.deleteDriver(id.value, driverToRemove.id)
        showRemoveModal.value = false
      } catch (error) {
        console.error('Error removing driver:', error)
      }
    }
  }
}

const removeConsumer = async () => {
  if (
    polly.value &&
    driverIndex.value >= 0 &&
    consumerIndex.value >= 0 &&
    polly.value.drivers
  ) {
    const driver = polly.value.drivers[driverIndex.value]
    if (
      driver &&
      driver.consumers &&
      driver.consumers[consumerIndex.value] &&
      driver.id
    ) {
      const consumerToRemove = driver.consumers[consumerIndex.value]
      if (consumerToRemove && consumerToRemove.id) {
        try {
          await dataService.deleteConsumer(id.value, driver.id, consumerToRemove.id)
          showRemoveConsumerModal.value = false
        } catch (error) {
          console.error('Error removing consumer:', error)
        }
      }
    }
  }
}

const openJoinModal = (index: number) => {
  joinDriverIndex.value = index
  joinMode.value = 'driver'
  showJoinModal.value = true
}

const toggleExpanded = (driverIdx: number, consumerIdx: number) => {
  const currentSet = expandedItems.value.get(driverIdx) || new Set<number>()
  if (currentSet.has(consumerIdx)) {
    currentSet.delete(consumerIdx)
  } else {
    currentSet.add(consumerIdx)
  }
  expandedItems.value.set(driverIdx, currentSet)
}

const shareOnWhatsApp = () => {
  const url = window.location.href
  const text = `Check out this carpool: ${polly.value?.description || 'Carpool'} ${url}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

const shareOnTelegram = () => {
  const url = window.location.href
  const text = polly.value?.description || 'Carpool'
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    '_blank'
  )
}

const shareViaSMS = () => {
  const url = window.location.href
  const text = `Check out this carpool: ${polly.value?.description || 'Carpool'} ${url}`
  window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank')
}

const shareOnSignal = () => {
  const url = window.location.href
  const text = `Check out this carpool: ${polly.value?.description || 'Carpool'} ${url}`
  window.open(`https://signal.me/?text=${encodeURIComponent(text)}`, '_blank')
}

const showNotificationSettings = () => {
  if (polly.value?.description) {
    notificationModalType.value = 'polly'
    showNotificationModal.value = true
  }
}

const showDriverNotificationSettings = (
  driverId: string,
  driverName: string | undefined
) => {
  notificationModalType.value = 'driver'
  currentDriverId.value = driverId
  currentDriverName.value = driverName || 'Unknown Driver'
  showNotificationModal.value = true
}

const onNotificationSaved = () => {
  // Modal will close automatically
}

const onConsumerAdded = async (consumer: { name: string; comments: string }) => {
  try {
    if (joinMode.value === 'waitingList') {
      await dataService.createWaitingListConsumer(id.value, consumer)
    } else {
      // Show loading state
      updatingDrivers.value.add(joinDriverIndex.value)

      // Create consumer via API
      if (polly.value && joinDriverIndex.value >= 0 && polly.value.drivers) {
        const driver = polly.value.drivers[joinDriverIndex.value]
        if (driver && driver.id) {
          await dataService.createConsumer(id.value, driver.id, consumer)
        }
      }
    }
  } catch (error) {
    console.error('Error adding consumer:', error)
  } finally {
    if (joinMode.value !== 'waitingList') {
      // Hide loading state
      updatingDrivers.value.delete(joinDriverIndex.value)
    }
  }
}

const startEditingTitle = () => {
  isEditingTitle.value = true
  editingTitle.value = polly.value?.description || ''
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
}

const cancelEditingTitle = () => {
  isEditingTitle.value = false
  editingTitle.value = ''
}

const toggleWaitingListExpanded = (index: number) => {
  if (expandedWaitingListItems.value.has(index)) {
    expandedWaitingListItems.value.delete(index)
  } else {
    expandedWaitingListItems.value.add(index)
  }
}

const confirmRemoveWaitingListConsumer = (index: number) => {
  waitingListConsumerIndex.value = index
  showRemoveWaitingListConsumerModal.value = true
}

const removeWaitingListConsumer = async () => {
  if (polly.value && waitingListConsumerIndex.value >= 0 && polly.value.consumers) {
    const consumer = polly.value.consumers[waitingListConsumerIndex.value]
    if (consumer && consumer.id) {
      try {
        await dataService.deleteWaitingListConsumer(id.value, consumer.id)
        showRemoveWaitingListConsumerModal.value = false
      } catch (error) {
        console.error('Error removing waiting list consumer:', error)
      }
    }
  }
}

const openWaitingListJoinModal = () => {
  joinMode.value = 'waitingList'
  showJoinModal.value = true
}

// Drag and drop functionality
const onPassengerDragStart = (
  passenger: { id?: string; name: string; comments?: string },
  index: number
) => {
  console.log('Passenger drag started:', passenger.name, index)
}

const onPassengerDragEnd = () => {
  console.log('Passenger drag ended')
}

const onPassengerDropped = async (
  driverIndex: number,
  passenger: { id?: string; name: string; comments?: string }
) => {
  try {
    if (polly.value && passenger.id) {
      // Show loading state for the target driver
      updatingDrivers.value.add(driverIndex)

      // Move passenger from waiting list to driver
      const driver = polly.value.drivers?.[driverIndex]
      if (driver && driver.id) {
        // Remove from waiting list (backend)
        await dataService.deleteWaitingListConsumer(id.value, passenger.id)

        // Add to driver (backend)
        await dataService.createConsumer(id.value, driver.id, {
          name: passenger.name,
          comments: passenger.comments
        })

        // Update local state - remove from waiting list
        if (polly.value.consumers) {
          const consumerIndex = polly.value.consumers.findIndex(
            (c) => c.id === passenger.id
          )
          if (consumerIndex !== -1) {
            polly.value.consumers.splice(consumerIndex, 1)
          }
        }

        console.log(`Moved passenger ${passenger.name} to driver ${driver.name}`)
      }
    }
  } catch (error) {
    console.error('Error moving passenger:', error)
  } finally {
    // Hide loading state
    updatingDrivers.value.delete(driverIndex)
  }
}

const saveTitle = async () => {
  // Check rate limiting
  if (!ValidationService.checkRateLimit('updatePollyTitle', 5, 60000)) {
    ValidationService.showRateLimitModal('update polly title', 5, 60000)
    return
  }

  // Comprehensive validation
  const validation = ValidationService.validatePollyDescription(editingTitle.value)

  titleError.value = validation.error || ''

  if (!validation.isValid) {
    return
  }

  try {
    const title = editingTitle.value.trim()
    await dataService.updatePolly(id.value, { description: title })

    // Update locally for immediate UI feedback
    if (polly.value) {
      polly.value.description = title
    }
    isEditingTitle.value = false
    editingTitle.value = ''
  } catch (error) {
    console.error('Error updating title:', error)
  }
}
</script>

<style>
.car-card {
  position: relative;
  overflow: visible;
}

.editable-title {
  cursor: pointer;
  transition: opacity 0.2s;
  display: inline-block;
}

.editable-title:hover {
  opacity: 0.8;
}

.edit-icon {
  color: #6c757d;
  cursor: pointer;
  transition: color 0.2s;
}

.edit-icon:hover {
  color: #495057;
}

.driver-header {
  cursor: pointer;
  transition: background-color 0.2s;
}

.driver-header:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.edit-driver-icon {
  color: #6c757d;
  opacity: 0;
  transition: opacity 0.2s, color 0.2s;
  pointer-events: none; /* Prevent icon from interfering with header click */
}

.driver-header:hover .edit-driver-icon {
  opacity: 1;
}

.driver-header:hover .edit-driver-icon:hover {
  color: #495057;
}

@media (min-width: 768px) {
  .car-card.parrot-right::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -60px;
    transform: translateY(-50%);
    width: 80px;
    height: 80px;
    background-image: url('/parrot.png');
    background-size: cover;
    background-position: center;
  }

  .car-card.parrot-left::after {
    content: '';
    position: absolute;
    top: 50%;
    left: -65px;
    transform: translateY(-50%);
    width: 80px;
    height: 80px;
    background-image: url('/parrot-left.png');
    background-size: cover;
    background-position: center;
  }
}

@media (max-width: 768px) {
  .car-card::after {
    content: '';
    position: absolute;
    bottom: -85px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 100px;
    background-image: url('/parrot-below.png');
    background-size: cover;
    background-position: center;
  }

  .car-bcol {
    margin-bottom: 35px;
  }
}
</style>
