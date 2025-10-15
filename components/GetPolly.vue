<template>
  <div class="row justify-content-md-center">
    <div class="col col-md-8">
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
      <BRow v-if="!polly?.drivers?.length">
        <BCol class="mb-3" md="6" offset-md="3">
          <BCard class="border-info shadow text-center no-drivers-card">
            <p>No drivers yet! Be a good parrot and offer a ride <i class="bi bi-emoji-smile-upside-down"></i></p>
          </BCard>
        </BCol>
      </BRow>
      <BRow v-else class="row-cols-1 row-cols-md-2 g-4">
        <BCol class="car-bcol" v-for="(driver, index) in polly?.drivers" :key="index">
          <BCard class="border-info shadow car-card h-100" :class="getDynamicParrotClass(index+1)">
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
    </div>

    <AddDriverModal v-model="showModal" :polly="polly" :id="id" @driver-added="onDriverAdded" />

    <BModal v-model="showRemoveModal" title="Confirm Removal" @ok="removeDriver">
      <p>Are you sure you want to remove this driver?</p>
    </BModal>

    <AddConsumerModal v-model="showJoinModal" @consumer-added="onConsumerAdded" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { BButton, BButtonGroup, BProgress, BModal, BCard, BCardBody, BCardFooter, BCardHeader, BCol, BRow, BListGroup, BListGroupItem } from 'bootstrap-vue-next'
import AddDriverModal from './AddDriverModal.vue'
import AddConsumerModal from './AddConsumerModal.vue'
import { dataService } from '../services/dataService'
import type { Polly } from '../models/polly.model'

const route = useRoute()
const id = ref(route.params.id as string)
const polly = ref<Polly | null>(null)
const isLoading = ref(true)
const showModal = ref(false)
const showRemoveModal = ref(false)
const driverIndex = ref(-1)
const showJoinModal = ref(false)
const joinDriverIndex = ref(-1)
const expandedItems = ref<Map<number, Set<number>>>(new Map())
const unsubscribe = ref<(() => void) | null>(null)

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

const onConsumerAdded = async (consumer: { name: string; comments: string }) => {
  if (polly.value && joinDriverIndex.value >= 0 && polly.value.drivers) {
    const driver = polly.value.drivers[joinDriverIndex.value]
    if (driver) {
      driver.consumers = driver.consumers || []
      driver.consumers.push(consumer)
      try {
        await dataService.updatePolly(id.value, { drivers: polly.value.drivers })
      } catch (error) {
        console.error('Error adding consumer:', error)
      }
    }
  }
}
</script>

<style>
.car-card {
  position: relative;
  overflow: visible;
}

.no-drivers-card {
  position: relative;
  overflow: visible;
}

.no-drivers-card::after {
  content: '';
  position: absolute;
  bottom: -80px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 100px;
  background-image: url('/parrot-below.png');
  background-size: cover;
  background-position: center;
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

  .no-drivers-card::after {
    display: none;
  }
}
@media (max-width: 768px) {
.car-card::after {
    content: '';
    position: absolute;
    bottom: -80px;
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
