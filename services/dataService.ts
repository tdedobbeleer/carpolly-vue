import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc
} from 'firebase/firestore'
import { db } from '../src/firebase'
import { ValidationService } from './validationService'
import type { Polly } from '../models/polly.model'
import type { Driver } from '../models/driver.model'
import type { Consumer } from '../models/consumer.model'

class DataService {
  private pollyCollection = 'pollies'

  private async updatePollyTimestamp(pollyId: string) {
    const docRef = doc(db, this.pollyCollection, pollyId)
    await updateDoc(docRef, { updatedAt: serverTimestamp() })
  }

  async createPolly(id: string, polly: Polly) {
    // Validate UUID format
    const uuidValidation = ValidationService.validateUUID(id)
    if (!uuidValidation.isValid) {
      throw new Error('Invalid Polly ID format')
    }

    // Validate polly data
    if (!polly.description) {
      throw new Error('Polly description is required')
    }
    const descValidation = ValidationService.validatePollyDescription(polly.description)
    if (!descValidation.isValid) {
      throw new Error(descValidation.error)
    }

    const docRef = doc(db, this.pollyCollection, id)
    const { drivers, consumers, ...pollyData } = polly
    const data = { ...pollyData, created: serverTimestamp(), updatedAt: serverTimestamp() }
    await setDoc(docRef, data, { merge: false })

    if (drivers && drivers.length > 0) {
      const driversCollection = collection(docRef, 'drivers')
      for (const driver of drivers) {
        const { consumers: driverConsumers, ...driverData } = driver
        const driverDocRef = await addDoc(driversCollection, driverData)

        if (driverConsumers && driverConsumers.length > 0) {
          const consumersCollection = collection(driverDocRef, 'consumers')
          for (const consumer of driverConsumers) {
            await addDoc(consumersCollection, consumer)
          }
        }
      }
    }

    if (consumers && consumers.length > 0) {
      const waitingListCollection = collection(docRef, 'consumers')
      for (const consumer of consumers) {
        await addDoc(waitingListCollection, consumer)
      }
    }
  }

  async getPolly(id: string) {
    const docRef = doc(db, this.pollyCollection, id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      const driversCollection = collection(docRef, 'drivers')
      const driversSnap = await getDocs(driversCollection)
      const drivers = await Promise.all(driversSnap.docs.map(async driverDoc => {
        const consumersCollection = collection(driverDoc.ref, 'consumers')
        const consumersSnap = await getDocs(consumersCollection)
        const driverConsumers = consumersSnap.docs.map(consumerDoc => ({ id: consumerDoc.id, ...consumerDoc.data() }))
        return { id: driverDoc.id, ...driverDoc.data(), consumers: driverConsumers } as Driver
      }))
      const waitingListCollection = collection(docRef, 'consumers')
      const waitingListSnap = await getDocs(waitingListCollection)
      const consumers = waitingListSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Consumer[]
      return { ...data, created: data.created?.toDate(), updatedAt: data.updatedAt?.toDate(), drivers, consumers } as Polly
    } else {
      throw new Error('Polly not found')
    }
  }

  async updatePolly(id: string, polly: Partial<Polly>) {
    const docRef = doc(db, this.pollyCollection, id)
    const pollyData = { ...polly }
    delete pollyData.drivers
    if (Object.keys(pollyData).length > 0) {
      await setDoc(docRef, pollyData, { merge: true })
    }
    // Update the timestamp
    await this.updatePollyTimestamp(id)
  }

  async createDriver(pollyId: string, driver: Driver) {
    // Validate inputs
    const uuidValidation = ValidationService.validateUUID(pollyId)
    if (!uuidValidation.isValid) {
      throw new Error('Invalid Polly ID format')
    }

    if (!driver.name || !driver.description || typeof driver.spots !== 'number') {
      throw new Error('Driver name, description, and spots are required')
    }
    const driverValidation = ValidationService.validateDriverForm(driver.name, driver.description, driver.spots)
    if (!driverValidation.isValid) {
      throw new Error(Object.values(driverValidation.errors).join(', '))
    }

    const pollyDocRef = doc(db, this.pollyCollection, pollyId)
    const driversCollection = collection(pollyDocRef, 'drivers')
    const { consumers, ...driverData } = driver
    const driverDocRef = await addDoc(driversCollection, driverData)

    if (consumers && consumers.length > 0) {
      for (const consumer of consumers) {
        await this.createConsumer(pollyId, driverDocRef.id, consumer)
      }
    }

    // Update polly timestamp
    await this.updatePollyTimestamp(pollyId)

    return driverDocRef.id
  }

  async updateDriver(pollyId: string, driverId: string, driver: Partial<Driver>) {
    const pollyDocRef = doc(db, this.pollyCollection, pollyId)
    const driverDocRef = doc(collection(pollyDocRef, 'drivers'), driverId)
    const driverData = { ...driver }
    delete driverData.consumers
    await updateDoc(driverDocRef, driverData)

    // Update driver timestamp to trigger subscription
    await updateDoc(driverDocRef, { lastUpdated: serverTimestamp() })

    // Update polly timestamp
    await this.updatePollyTimestamp(pollyId)
  }

  async deleteDriver(pollyId: string, driverId: string) {
    const pollyDocRef = doc(db, this.pollyCollection, pollyId)
    const driverDocRef = doc(collection(pollyDocRef, 'drivers'), driverId)
    await deleteDoc(driverDocRef)

    // Update polly timestamp
    await this.updatePollyTimestamp(pollyId)
  }

  async createConsumer(pollyId: string, driverId: string, consumer: Consumer) {
    // Validate inputs
    const pollyUuidValidation = ValidationService.validateUUID(pollyId)
    if (!pollyUuidValidation.isValid) {
      throw new Error('Invalid Polly ID format')
    }

    if (!consumer.name) {
      throw new Error('Consumer name is required')
    }
    const consumerValidation = ValidationService.validateConsumerForm(consumer.name, consumer.comments || '')
    if (!consumerValidation.isValid) {
      throw new Error(Object.values(consumerValidation.errors).join(', '))
    }

    const pollyDocRef = doc(db, this.pollyCollection, pollyId)
    const driverDocRef = doc(collection(pollyDocRef, 'drivers'), driverId)
    const consumersCollection = collection(driverDocRef, 'consumers')
    const consumerDocRef = await addDoc(consumersCollection, consumer)

    // Update polly timestamp
    await this.updatePollyTimestamp(pollyId)

    return consumerDocRef.id
  }

  async updateConsumer(pollyId: string, driverId: string, consumerId: string, consumer: Partial<Consumer>) {
    const pollyDocRef = doc(db, this.pollyCollection, pollyId)
    const driverDocRef = doc(collection(pollyDocRef, 'drivers'), driverId)
    const consumerDocRef = doc(collection(driverDocRef, 'consumers'), consumerId)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _unused, ...consumerData } = consumer
    await updateDoc(consumerDocRef, consumerData)

    // Update polly timestamp
    await this.updatePollyTimestamp(pollyId)
  }

  async deleteConsumer(pollyId: string, driverId: string, consumerId: string) {
    const pollyDocRef = doc(db, this.pollyCollection, pollyId)
    const driverDocRef = doc(collection(pollyDocRef, 'drivers'), driverId)
    const consumerDocRef = doc(collection(driverDocRef, 'consumers'), consumerId)
    await deleteDoc(consumerDocRef)

    // Update polly timestamp
    await this.updatePollyTimestamp(pollyId)
  }

  async createWaitingListConsumer(pollyId: string, consumer: Consumer) {
    // Validate inputs
    const pollyUuidValidation = ValidationService.validateUUID(pollyId)
    if (!pollyUuidValidation.isValid) {
      throw new Error('Invalid Polly ID format')
    }
    if (!consumer.name) {
      throw new Error('Consumer name is required')
    }
    const consumerValidation = ValidationService.validateConsumerForm(consumer.name, consumer.comments || '')
    if (!consumerValidation.isValid) {
      throw new Error(Object.values(consumerValidation.errors).join(', '))
    }
    const pollyDocRef = doc(db, this.pollyCollection, pollyId)
    const waitingListCollection = collection(pollyDocRef, 'consumers')
    const consumerDocRef = await addDoc(waitingListCollection, consumer)

    // Update polly timestamp
    await this.updatePollyTimestamp(pollyId)

    return consumerDocRef.id
  }

  async updateWaitingListConsumer(pollyId: string, consumerId: string, consumer: Partial<Consumer>) {
    const pollyDocRef = doc(db, this.pollyCollection, pollyId)
    const waitingListCollection = collection(pollyDocRef, 'consumers')
    const consumerDocRef = doc(waitingListCollection, consumerId)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _unused, ...consumerData } = consumer
    await updateDoc(consumerDocRef, consumerData)

    // Update polly timestamp
    await this.updatePollyTimestamp(pollyId)
  }

  async deleteWaitingListConsumer(pollyId: string, consumerId: string) {
    const pollyDocRef = doc(db, this.pollyCollection, pollyId)
    const waitingListCollection = collection(pollyDocRef, 'consumers')
    const consumerDocRef = doc(waitingListCollection, consumerId)
    await deleteDoc(consumerDocRef)

    // Update polly timestamp
    await this.updatePollyTimestamp(pollyId)
  }

  subscribeToPolly(id: string, callback: (polly: Polly | null) => void) {
    const docRef = doc(db, this.pollyCollection, id)
    const driversCollection = collection(docRef, 'drivers')
    const unsubscribeDrivers = onSnapshot(driversCollection, async (driversSnap) => {
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        const waitingListCollection = collection(docRef, 'consumers')
        const waitingListSnap = await getDocs(waitingListCollection)
        const consumers = waitingListSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Consumer[]
        const drivers = await Promise.all(driversSnap.docs.map(async driverDoc => {
          const consumersCollection = collection(driverDoc.ref, 'consumers')
          onSnapshot(consumersCollection, (consumersSnap) => {
            const driverConsumers = consumersSnap.docs.map(consumerDoc => ({ id: consumerDoc.id, ...consumerDoc.data() }))
            // Trigger callback when consumers change - rebuild full drivers list
            Promise.all(driversSnap.docs.map(async d => {
              if (d.id === driverDoc.id) {
                return { id: d.id, ...d.data(), consumers: driverConsumers } as Driver
              } else {
                const otherConsumersCollection = collection(d.ref, 'consumers')
                const otherConsumersSnap = await getDocs(otherConsumersCollection)
                const otherConsumers = otherConsumersSnap.docs.map(c => ({ id: c.id, ...c.data() }))
                return { id: d.id, ...d.data(), consumers: otherConsumers } as Driver
              }
            })).then(finalDrivers => {
              callback({ ...data, created: data.created?.toDate(), updatedAt: data.updatedAt?.toDate(), drivers: finalDrivers, consumers } as Polly)
            })
          })
          // For initial load, get consumers synchronously
          const consumersSnap = await getDocs(consumersCollection)
          const driverConsumers = consumersSnap.docs.map(consumerDoc => ({ id: consumerDoc.id, ...consumerDoc.data() }))
          return { id: driverDoc.id, ...driverDoc.data(), consumers: driverConsumers } as Driver
        }))
        callback({ ...data, created: data.created?.toDate(), updatedAt: data.updatedAt?.toDate(), drivers, consumers } as Polly)
      } else {
        callback(null)
      }
    })
    const waitingListCollection = collection(docRef, 'consumers')
    const unsubscribeWaitingList = onSnapshot(waitingListCollection, async () => {
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        const driversSnap = await getDocs(driversCollection)
        const drivers = await Promise.all(driversSnap.docs.map(async driverDoc => {
          const consumersCollection = collection(driverDoc.ref, 'consumers')
          const consumersSnap = await getDocs(consumersCollection)
          const driverConsumers = consumersSnap.docs.map(consumerDoc => ({ id: consumerDoc.id, ...consumerDoc.data() }))
          return { id: driverDoc.id, ...driverDoc.data(), consumers: driverConsumers } as Driver
        }))
        const waitingListSnap = await getDocs(waitingListCollection)
        const consumers = waitingListSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Consumer[]
        callback({ ...data, created: data.created?.toDate(), drivers, consumers } as Polly)
      } else {
        callback(null)
      }
    })
    return () => {
      unsubscribeDrivers()
      unsubscribeWaitingList()
    }
  }
}

export const dataService = new DataService()
