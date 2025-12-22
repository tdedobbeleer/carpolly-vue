<template>
  <BCard
    ref="driverCard"
    class="border-info shadow car-card h-100 position-relative droppable-driver"
    :class="[getDynamicParrotClass(driverIndex + 1), { 'driver-full': isDriverFull, 'move-target-active': isMoveTargetActive }]"
    @click="handleDriverClick"
    :data-driver-index="driverIndex"
  >
    <div v-if="isUpdating" class="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex align-items-center justify-content-center" style="z-index: 10;">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <BCardHeader class="driver-header position-relative" @click.stop="$emit('edit-driver', driver)">
      <div class="text-center">
        <BButton variant="primary" size="lg" disabled class="position-relative">
          <i class="bi bi-car-front"></i>
          <BBadge
            variant="info"
            pill
            class="position-absolute top-0 start-100 translate-middle"
          >
            {{ driver.spots || 0 }}
            <span class="visually-hidden">Total spots</span>
          </BBadge>
        </BButton>
        <div>{{ driver.name }}</div>
      </div>
      <p>When & where?<br/>{{ driver.description }}</p>
      <BProgress
        class="mb-3"
        :variant="getProgressVariant(driver.consumers?.length || 0, driver.spots || 0)"
        :value="countProgress(driver.consumers?.length || 0, driver.spots || 0)"/>
      <p v-if="isDriverFull" class="text-danger mb-3">All spots are filled!<br/>{{ getRandomFunnyMessage() }}</p>
      <i class="bi bi-pencil edit-driver-icon position-absolute top-0 end-0 m-2" title="Edit driver"></i>
    </BCardHeader>

    <BCardBody>
      <!-- Move target drop zone - shown when a passenger is being moved -->
      <div class="move-drop-zone mb-2" v-if="isMoveTargetActive && !isDriverFull">
        <small class="text-muted">
          <i class="bi bi-arrow-down-circle"></i> Drop passenger here
        </small>
      </div>

      <BListGroup v-if="driver.consumers?.length && driver.consumers?.length > 0">
        <BListGroupItem v-for="(consumer, consumerIndex) in driver.consumers" :key="consumerIndex" button>
          {{ consumer.name }}
          <div class="float-end">
            <BButton v-if="consumer.comments" class="btn-sm me-1" @click.stop="$emit('toggle-consumer-comments', driverIndex, consumerIndex)">
              <i class="bi bi-chat-left-text"></i>
            </BButton>
            <BButton class="btn-sm" variant="outline-danger" @click.stop="$emit('remove-consumer', driverIndex, consumerIndex)">
              <i class="bi bi-trash3"></i>
            </BButton>
          </div>
          <div v-if="expandedConsumerItems.has(consumerIndex) && consumer.comments" class="mt-2">
            <i>{{ consumer.comments }}</i>
          </div>
        </BListGroupItem>
      </BListGroup>
      <p v-else>No passengers yet. <i class="bi bi-emoji-frown"></i></p>
    </BCardBody>

    <BCardFooter>
      <BButtonGroup>
        <BButton :disabled="isDriverFull" @click="$emit('join-driver', driverIndex)">I wanna join this ride! <i class="bi bi-person-walking"></i></BButton>
        <!-- Temporarily disabled due to TypeScript compilation issue
        <BButton
          v-if="NotificationService.isSupported() && driver.id"
          size="sm"
          variant="outline-primary"
          @click="handleDriverNotifications"
          title="Driver notification settings"
          class="position-relative"
        >
          <i class="bi bi-bell"></i>
          <BBadge v-if="driverSubscriptions[driver.id]"
            dot-indicator
            variant="success"
            class="position-absolute top-0 start-100 translate-middle"
          />
        </BButton>
        -->
      </BButtonGroup>
    </BCardFooter>

    <div class="d-grid mt-2">
        <BButton @click="$emit('remove-driver', driverIndex)" class="bg-danger btn-sm"><i class="bi bi-trash3"></i></BButton>
    </div>
  </BCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BCard, BCardBody, BCardFooter, BCardHeader, BListGroup, BListGroupItem, BButton, BButtonGroup, BProgress, BBadge } from 'bootstrap-vue-next'
// import { NotificationService } from '../services/notificationService'
import type { Driver } from '../models/driver.model'
import type { Consumer } from '../models/consumer.model'

interface Props {
  driver: Driver
  driverIndex: number
  isUpdating?: boolean
  expandedConsumerItems?: Set<number>
  driverSubscriptions?: Record<string, boolean>
  waitingListConsumers?: Consumer[]
  // New props for move mode
  passengerToMove?: { id?: string; name: string; comments?: string } | null
}

const props = withDefaults(defineProps<Props>(), {
  isUpdating: false,
  expandedConsumerItems: () => new Set(),
  driverSubscriptions: () => ({}),
  waitingListConsumers: () => [],
  passengerToMove: null
})

const emit = defineEmits<{
  'edit-driver': [driver: Driver]
  'join-driver': [driverIndex: number]
  'remove-driver': [driverIndex: number]
  'remove-consumer': [driverIndex: number, consumerIndex: number]
  'toggle-consumer-comments': [driverIndex: number, consumerIndex: number]
  'passenger-dropped': [driverIndex: number, passenger: { id?: string; name: string; comments?: string }]
  'move-passenger-to-driver': [driverIndex: number]
}>()

// Check if this driver is a valid move target
const isMoveTargetActive = computed(() => {
  return props.passengerToMove !== null && !isDriverFull.value
})

const handleDriverClick = () => {
  // If there's a passenger being moved and this driver is not full, move the passenger
  if (props.passengerToMove && !isDriverFull.value) {
    console.log(`Moving passenger ${props.passengerToMove.name} to driver ${props.driver.name}`)
    emit('move-passenger-to-driver', props.driverIndex)
  }
}

const isDriverFull = computed(() => {
  return (props.driver.consumers?.length || 0) >= (props.driver.spots || 0)
})

const getDynamicParrotClass = (index: number) => {
  if (index % 2 === 0 && index % 4 !== 0) {
    return 'parrot-right'
  }
  else if (index % 3 === 0) {
    return 'parrot-left'
  }
}

const countProgress = (current: number, max: number) => {
  if (current === 0 || max === 0) {
    return 0
  }
  else {
    return (current / max) * 100
  }
}

const getProgressVariant = (current: number, max: number) => {
  if (current >= max) {
    return 'danger'
  }
  return 'info'
}

const funnyMessages = [
  "Who will call shotgun first?",
  "I hope it's not too cramped",
  "The thinnest sits in the middle!",
  "The oldest chooses the spot first!",
  "I hope the trunk can handle the junk.",
  "Don't forget to go to the bathroom before you leave.",
  "I hope it's a SUV.",
  "Fasten your seatbelts! The driver is responsible.",
  "Please, keep the car clean. It's like a house. Don't go in with dirty shoes.",
  "Let's prepare a singalong playlist! That's always nice.",
  "Keep quiet in the back, the driver needs to concentrate.",
  "If you don't keep quiet, you can resume the rest of the drive on foot!",
  "Don't fight over the Nintendo, everyone get's a turn."
]

const getRandomFunnyMessage = () => {
  // Generate a unique key for this driver
  const driverKey = `funnyMessage_${props.driver.id || props.driverIndex}`

  // Check if message already exists in sessionStorage
  const storedMessage = sessionStorage.getItem(driverKey)
  if (storedMessage) {
    return storedMessage
  }

  // Generate and store a new random message
  const randomIndex = Math.floor(Math.random() * funnyMessages.length)
  const selectedMessage = funnyMessages[randomIndex] ?? funnyMessages[0]!

  // Store the message in sessionStorage
  sessionStorage.setItem(driverKey, selectedMessage)

  return selectedMessage
}

</script>

<style scoped>
.droppable-driver {
  transition: all 0.3s ease;
}

.droppable-driver.move-target-active {
  border-color: #6c757d !important;
  cursor: pointer;
}

.droppable-driver.driver-full {
  opacity: 0.7;
}

.drop-zone-hint {
  text-align: center;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 2px dashed #dee2e6;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  display: block !important; /* Ensure it's always visible when condition is met */
}

.move-drop-zone {
  text-align: center;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 2px dashed #dee2e6;
  transition: all 0.3s ease;
  margin-bottom: 8px;
  display: block !important;
}

.droppable-driver.move-target-active .move-drop-zone {
  border-color: #6c757d;
  background-color: #f5f5f5;
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
  pointer-events: none;
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
