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
          <div class="editable-title-container d-flex align-items-center" @mouseenter="showEditIcon = true" @mouseleave="showEditIcon = false">
            <h1 v-if="!isEditingTitle" @click="startEditingTitle" class="editable-title">{{ polly?.description }}</h1>
            <div v-else class="d-flex align-items-center">
              <input
                ref="titleInput"
                v-model="editingTitle"
                @keyup.enter="saveTitle"
                @keyup.escape="cancelEditingTitle"
                @input="resetTitleError"
                :class="{ 'form-control': true, 'form-control-lg': true, 'me-2': true, 'is-invalid': titleError }"
                type="text"
                maxlength="60"
                required
              />
              <div v-if="titleError" class="invalid-feedback d-block">
                {{ titleError }}
              </div>
              <BButton @click="saveTitle" variant="success" size="sm" class="d-block d-md-none">
                <i class="bi bi-check"></i>
              </BButton>
            </div>
            <i v-if="!isEditingTitle && showEditIcon" class="bi bi-pencil edit-icon ms-2" title="Edit title"></i>
          </div>
        </BCol>
        </BRow>
        <BRow>
        <BCol xs="6">
          <div class="d-flex gap-2">
            <BButton size="sm" variant="outline-primary" @click="shareOnWhatsApp" title="Share on WhatsApp">
              <i class="bi bi-whatsapp"></i>
            </BButton>
            <BButton size="sm" variant="outline-primary" @click="shareOnTelegram" title="Share on Telegram">
              <i class="bi bi-telegram"></i>
            </BButton>
            <BButton size="sm" variant="outline-primary" @click="shareOnSignal" title="Share on Signal">
              Signal
            </BButton>
            <BButton size="sm" variant="outline-primary" @click="shareViaSMS" title="Share via SMS">
              <i class="bi bi-chat-dots"></i>
            </BButton>
          </div>
        </BCol>
        <BCol xs="6" class="text-end">
          <BButton
            v-if="NotificationService.isSupported()"
            size="sm"
            :variant="NotificationService.isSubscribedToPolly(id) ? 'primary' : 'outline-primary'"
            @click="showNotificationSettings"
            title="Notification settings"
          >
            <i class="bi bi-bell-fill" v-if="NotificationService.isSubscribedToPolly(id)"></i>
            <i class="bi bi-bell" v-else></i>
          </BButton>
        </BCol>
      </BRow>
      <div class="d-flex m-3">
        <h2>Drivers and spots available</h2>
        <BButton class="ms-auto" @click="addDriverModal?.show()">I'm a driver! <span class="bi bi-car-front-fill"></span></BButton>
      </div>
      <BRow v-if="!polly?.drivers?.length">
        <BCol class="mb-3" md="6" offset-md="3">
          <BCard class="border-info shadow text-center parrot-card">
            <p>No drivers yet! Be a good parrot and offer a ride <i class="bi bi-emoji-smile-upside-down"></i></p>
          </BCard>
        </BCol>
      </BRow>
      <BRow v-else class="row-cols-1 row-cols-md-2 g-4">
        <BCol class="car-bcol" v-for="(driver, index) in polly?.drivers" :key="index">
          <BCard class="border-info shadow car-card h-100 position-relative" :class="getDynamicParrotClass(index+1)">
            <div v-if="updatingDrivers.has(index)" class="position-absolute top-0 start-0 w-100 h-100 bg-white bg-opacity-75 d-flex align-items-center justify-content-center" style="z-index: 10;">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <BCardHeader>
              <div class="text-center">
                <div class="btn btn-lg btn-primary disabled position-relative">
                  <i class="bi bi-car-front"></i>
                  <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary">
                    {{ driver.spots || 0 }}
                    <span class="visually-hidden">Total spots</span>
                  </span>
                </div>
                <div>{{ driver.name }}</div>
              </div>
              <p>When & where?<br/>{{ driver.description }}</p>
              <BProgress
                class="mb-3"
                :variant="getProgressVariant(driver.consumers?.length || 0, driver.spots || 0)"
                :value="countProgress(driver.consumers?.length || 0, driver.spots || 0)"/>
              <p v-if="(driver.consumers?.length || 0) >= (driver.spots || 0)" class="text-danger mb-3">All spots are filled!</p>
            </BCardHeader>
            <BCardBody>
              <BListGroup v-if="driver.consumers?.length && driver.consumers?.length > 0">
                <BListGroupItem v-for="(consumer, consumerIndex) in driver.consumers" :key="consumerIndex" button>
                  {{ consumer.name }}
                  <div class="float-end">
                    <BButton v-if="consumer.comments" class="btn-sm me-1" @click="toggleExpanded(index, consumerIndex)">
                      <i class="bi bi-chat-left-text"></i>
                    </BButton>
                    <BButton class="btn-sm" variant="outline-danger" @click="confirmRemoveConsumer(index, consumerIndex)">
                      <i class="bi bi-trash3"></i>
                    </BButton>
                  </div>
                  <div v-if="expandedItems.get(index)?.has(consumerIndex) && consumer.comments" class="mt-2">
                    <i>{{ consumer.comments }}</i>
                  </div>
                </BListGroupItem>
              </BListGroup>
              <p v-else>No passengers yet. <i class="bi bi-emoji-frown"></i></p>
            </BCardBody>
            <BCardFooter>
              <BButtonGroup>
                <BButton :disabled="!!(driver.consumers?.length && driver.consumers?.length === driver.spots)" @click="openJoinModal(index)">I wanna join this ride! <i class="bi bi-person-walking"></i></BButton>
                <BButton
                  v-if="NotificationService.isSupported() && driver.id"
                  size="sm"
                  :variant="NotificationService.isSubscribedToDriverPassengers(driver.id) ? 'primary' : 'outline-primary'"
                  @click="showDriverNotificationSettings(driver.id!, driver.name)"
                  title="Driver notification settings"
                >
                  <i class="bi bi-bell-fill" v-if="NotificationService.isSubscribedToDriverPassengers(driver.id)"></i>
                  <i class="bi bi-bell" v-else></i>
                </BButton>
              </BButtonGroup>
            </BCardFooter>
            <div class="d-grid mt-2">
                <BButton @click="confirmRemove(index)" class="bg-danger btn-sm"><i class="bi bi-trash3"></i></BButton>
            </div>
          </BCard>
        </BCol>
      </BRow>
      </div>
    </BCol>

    <AddDriverModal ref="addDriverModal" :polly="polly" :id="id" @driver-added="onDriverAdded" />

    <BModal v-model="showRemoveModal" title="Confirm Removal" @ok="removeDriver">
      <p>Are you sure you want to remove this driver?</p>
    </BModal>

    <BModal v-model="showRemoveConsumerModal" title="Confirm Removal" @ok="removeConsumer">
      <p>Are you sure you want to remove this passenger?</p>
    </BModal>

    <AddConsumerModal v-model="showJoinModal" @consumer-added="onConsumerAdded" />

    <NotificationSettingsModal
      v-model="showNotificationModal"
      :modal-type="notificationModalType"
      :polly-id="notificationModalType === 'polly' ? id : undefined"
      :polly-description="notificationModalType === 'polly' ? polly?.description : undefined"
      :driver-id="notificationModalType === 'driver' ? currentDriverId : undefined"
      :driver-name="notificationModalType === 'driver' ? currentDriverName : undefined"
      @saved="onNotificationSaved"
    />
  </BRow>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { BButton, BButtonGroup, BProgress, BModal, BCard, BCardBody, BCardFooter, BCardHeader, BCol, BRow, BListGroup, BListGroupItem } from 'bootstrap-vue-next'
import AddDriverModal from './AddDriverModal.vue'
import AddConsumerModal from './AddConsumerModal.vue'
import NotificationSettingsModal from './NotificationSettingsModal.vue'
import { dataService } from '../services/dataService'
import { ValidationService } from '../services/validationService'
import { NotificationService } from '../services/notificationService'
import type { Polly } from '../models/polly.model'

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
const updatingDrivers = ref<Set<number>>(new Set())
const showNotificationModal = ref(false)
const notificationModalType = ref<'polly' | 'driver'>('polly')
const currentDriverId = ref('')
const currentDriverName = ref('')

const resetTitleError = () => {
  titleError.value = ''
}

onMounted(() => {
  unsubscribe.value = dataService.subscribeToPolly(id.value, (data) => {
    polly.value = data
    isLoading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value()
  }
})

const onDriverAdded = () => {
  // Modal is now controlled by useTemplateRef, no need to set showModal
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
  if (polly.value && driverIndex.value >= 0 && consumerIndex.value >= 0 && polly.value.drivers) {
    const driver = polly.value.drivers[driverIndex.value]
    if (driver && driver.consumers && driver.consumers[consumerIndex.value] && driver.id) {
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

const getDynamicParrotClass = (index : number) => {
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

const openJoinModal = (index: number) => {
  joinDriverIndex.value = index
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
  window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
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

const showDriverNotificationSettings = (driverId: string, driverName: string | undefined) => {
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
    // Show loading state
    updatingDrivers.value.add(joinDriverIndex.value)
    // Create consumer via API
    if (polly.value && joinDriverIndex.value >= 0 && polly.value.drivers) {
      const driver = polly.value.drivers[joinDriverIndex.value]
      if (driver && driver.id) {
        await dataService.createConsumer(id.value, driver.id, consumer)
      }
    }
  } catch (error) {
    console.error('Error adding consumer:', error)
  } finally {
    // Hide loading state
    updatingDrivers.value.delete(joinDriverIndex.value)
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
    const title = editingTitle.value.trim();
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
    left: -60px;
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

