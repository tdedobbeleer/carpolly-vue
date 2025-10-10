<template>
  <div class="row justify-content-md-center">
    <div class="col col-md-8">
      <div class="d-flex align-items-center mb-3">
        <h1>{{ polly?.description }}</h1>
        <div class="ms-3 d-flex gap-2">
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
      </div>
      <div class="d-flex m-3">
        <h2>Drivers and spots available</h2>
        <BButton class="ms-auto" @click="showModal = true">Add <span class="bi bi-car-front-fill"></span></BButton>
      </div>
      <BRow>
        <BCol class="mb-3" md="6" v-for="(driver, index) in polly?.drivers" :key="index">
          <BCard style="height: 100%;" class="border-info shadow">
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
                variant="info"
                :value="countProgress(driver.consumers?.length || 0, driver.spots || 0)"/>
            </BCardHeader>
            <BCardBody>
              <BListGroup v-if="driver.consumers?.length && driver.consumers?.length > 0">
                <BListGroupItem v-for="(consumer, consumerIndex) in driver.consumers" :key="consumerIndex" button>
                  {{ consumer.name }}
                  <BButton v-if="consumer.comments" class="btn-sm float-end" @click="toggleExpanded(index, consumerIndex)">
                    <i class="bi bi-chat-left-text"></i>
                  </BButton>
                  <div v-if="expandedItems.get(index)?.has(consumerIndex) && consumer.comments" class="mt-2">
                    <i>{{ consumer.comments }}</i>
                  </div>
                </BListGroupItem>
              </BListGroup>
              <p v-else>No passengers yet. <i class="bi bi-emoji-frown"></i></p>
            </BCardBody>
            <BCardFooter>
              <BButtonGroup>
                <BButton :disabled="!!(driver.consumers?.length && driver.consumers?.length === driver.spots)" @click="openJoinModal(index)">I wanna join!</BButton>
              </BButtonGroup>
            </BCardFooter>
            <div class="d-grid mt-2">
                <BButton @click="confirmRemove(index)" class="bg-danger btn-sm"><i class="bi bi-trash3"></i></BButton>
            </div>
          </BCard>
        </BCol>
      </BRow>
    </div>

    <AddDriverModal v-model="showModal" :polly="polly" :id="id" @driver-added="onDriverAdded" />

    <BModal v-model="showRemoveModal" title="Confirm Removal" @ok="removeDriver">
      <p>Are you sure you want to remove this driver?</p>
    </BModal>

    <BModal v-model="showJoinModal" title="Join Driver" @ok="addConsumer">
      <BForm>
        <BFormGroup label="Your Name:" label-for="consumerName">
          <BFormInput
            id="consumerName"
            v-model="consumerName"
            :class="{ 'is-invalid': nameError }"
            type="text"
            required
          />
          <div class="invalid-feedback" v-if="nameError">Name is required.</div>
        </BFormGroup>
        <BFormGroup label="Comments (optional):" label-for="consumerComments">
          <BFormTextarea
            id="consumerComments"
            v-model="consumerComments"
            rows="3"
          />
        </BFormGroup>
      </BForm>
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { BButton, BButtonGroup, BProgress, BModal, BForm, BFormGroup, BFormInput, BFormTextarea, BCard, BCardBody, BCardFooter, BCardHeader, BCol, BRow, BListGroup, BListGroupItem } from 'bootstrap-vue-next'
import AddDriverModal from './AddDriverModal.vue'
import { dataService } from '../services/dataService'
import type { Polly } from '../models/polly.model'

const route = useRoute()
const id = ref(route.params.id as string)
const polly = ref<Polly | null>(null)
const showModal = ref(false)
const showRemoveModal = ref(false)
const driverIndex = ref(-1)
const showJoinModal = ref(false)
const joinDriverIndex = ref(-1)
const consumerName = ref('')
const consumerComments = ref('')
const nameError = ref(false)
const expandedItems = ref<Map<number, Set<number>>>(new Map())
const unsubscribe = ref<(() => void) | null>(null)

onMounted(() => {
  unsubscribe.value = dataService.subscribeToPolly(id.value, (data) => {
    polly.value = data
  })
})

onUnmounted(() => {
  if (unsubscribe.value) {
    unsubscribe.value()
  }
})

const onDriverAdded = () => {
  showModal.value = false
}

const confirmRemove = (index: number) => {
  driverIndex.value = index
  showRemoveModal.value = true
}

const removeDriver = async () => {
  if (polly.value && driverIndex.value >= 0 && polly.value.drivers) {
    polly.value.drivers.splice(driverIndex.value, 1)
    try {
      await dataService.updatePolly(id.value, { drivers: polly.value.drivers })
      showRemoveModal.value = false
    } catch (error) {
      console.error('Error removing driver:', error)
    }
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

const openJoinModal = (index: number) => {
  joinDriverIndex.value = index
  consumerName.value = ''
  consumerComments.value = ''
  nameError.value = false
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

const addConsumer = async () => {
  if (!consumerName.value.trim()) {
    nameError.value = true
    return
  }
  nameError.value = false
  if (polly.value && joinDriverIndex.value >= 0 && polly.value.drivers) {
    const driver = polly.value.drivers[joinDriverIndex.value]
    if (driver) {
      driver.consumers = driver.consumers || []
      driver.consumers.push({
        name: consumerName.value,
        comments: consumerComments.value || ""
      })
      try {
        await dataService.updatePolly(id.value, { drivers: polly.value.drivers })
        showJoinModal.value = false
        consumerName.value = ''
        consumerComments.value = ''
      } catch (error) {
        console.error('Error adding consumer:', error)
      }
    }
  }

}
</script>

<style scoped>
/* Add styles if needed */
</style>
