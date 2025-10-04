<template>
  <div class="row justify-content-md-center">
    <div class="col col-md-8">
      <h1>{{ polly?.description }}</h1>
      <div class="d-flex m-3">
        <h2>Drivers and spots available</h2>
        <BButton class="ms-auto" @click="showModal = true">Add <span class="bi bi-car-front-fill"></span></BButton>
      </div>
      
      <div>
        <BCard v-for="(driver, index) in polly?.drivers" :key="index"
          no-body
          class="overflow-hidden"
        >
          <BRow class="g-0">
            <BCol md="6">
              <i class="bi bi-person-raised-hand"></i>
              {{ driver.name }}
            </BCol>
            <BCol md="6">
              <BCardBody>
                <BCardText>
                  This is a wider card with supporting text as a natural lead-in to additional content.
                  This content is a little bit longer.
                </BCardText>
              </BCardBody>
            </BCol>
          </BRow>
        </BCard>
      </div>
      <div>
        <BListGroup v-for="(driver, index) in polly?.drivers" :key="index">
          <BProgress :value="countProgress(driver.consumers?.length || 0, driver.spots || 0)" class="clear-fix"/>
          <BListGroupItem class="d-flex justify-content-between align-items-center">
            <p>Your driver: {{ driver.name }}</p>
            <p>Description:<br/>{{ driver.description }}</p>
            <p>Maximum spots:<br/>{{ driver.spots }}</p>
          </BListGroupItem>
          <div>
            <ul>
            <li v-for="consumer in driver.consumers" :key="consumer.name">{{ consumer }}</li>
          </ul>
          <BButtonGroup>
            <BButton @click="confirmRemove(index)">Remove</BButton>
            <BButton @click="openJoinModal(index)">I wanna join!</BButton>
          </BButtonGroup>
          </div>

        </BListGroup>
      </div>
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
            type="text"
            required
          />
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
import { BButton, BProgress, BModal, BForm, BFormGroup, BFormInput, BFormTextarea } from 'bootstrap-vue-next'
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
  showJoinModal.value = true
}

const addConsumer = async () => {
  if (!consumerName.value.trim()) {
    return
  }
  if (polly.value && joinDriverIndex.value >= 0 && polly.value.drivers) {
    const driver = polly.value.drivers[joinDriverIndex.value]
    if (driver) {
      driver.consumers = driver.consumers || []
      driver.consumers.push({
        name: consumerName.value,
        comments: consumerComments.value || undefined
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