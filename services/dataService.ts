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
import type { Polly } from '../models/polly.model'
import type { Driver } from '../models/driver.model'

class DataService {
  private pollyCollection = 'pollies'

  async createPolly(id: string, polly: Polly) {
    const docRef = doc(db, this.pollyCollection, id)
    const { drivers, ...pollyData } = polly
    const data = { ...pollyData, created: serverTimestamp() }
    await setDoc(docRef, data, { merge: false })

    if (drivers && drivers.length > 0) {
      const driversCollection = collection(docRef, 'drivers')
      for (const driver of drivers) {
        const { consumers, ...driverData } = driver
        const driverDocRef = await addDoc(driversCollection, driverData)

        if (consumers && consumers.length > 0) {
          const consumersCollection = collection(driverDocRef, 'consumers')
          for (const consumer of consumers) {
            await addDoc(consumersCollection, consumer)
          }
        }
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
        const consumers = consumersSnap.docs.map(consumerDoc => ({ id: consumerDoc.id, ...consumerDoc.data() }))
        return { id: driverDoc.id, ...driverDoc.data(), consumers } as Driver
      }))
      return { ...data, created: data.created?.toDate(), drivers } as Polly
    } else {
      throw new Error('Polly not found')
    }
  }

  async updatePolly(id: string, polly: Partial<Polly>) {
    const docRef = doc(db, this.pollyCollection, id)
    const { drivers, ...pollyData } = polly
    await setDoc(docRef, pollyData, { merge: true })

    if (drivers !== undefined) {
      const driversCollection = collection(docRef, 'drivers')
      const existingDriversSnap = await getDocs(driversCollection)
      const existingDrivers = existingDriversSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

      // Delete existing drivers not in the new list
      for (const existingDriver of existingDrivers) {
        if (!drivers.some(d => d.id === existingDriver.id)) {
          const driverDocRef = doc(driversCollection, existingDriver.id)
          await deleteDoc(driverDocRef)
        }
      }

      // Add or update drivers
      for (const driver of drivers) {
        const { consumers, ...driverData } = driver
        if (driver.id) {
          // Update existing driver
          const driverDoc = doc(driversCollection, driver.id)
          await updateDoc(driverDoc, driverData)

          // Handle consumers for this driver
          if (consumers !== undefined) {
            const consumersCollection = collection(driverDoc, 'consumers')
            const existingConsumersSnap = await getDocs(consumersCollection)
            const existingConsumers = existingConsumersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))

            // Delete existing consumers not in the new list
            for (const existingConsumer of existingConsumers) {
              if (!consumers.some(c => c.id === existingConsumer.id)) {
                const consumerDocRef = doc(consumersCollection, existingConsumer.id)
                await deleteDoc(consumerDocRef)
              }
            }

            // Add or update consumers
            for (const consumer of consumers) {
              if (consumer.id) {
                // Update existing consumer
                const consumerDoc = doc(consumersCollection, consumer.id)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id: _, ...consumerData } = consumer
                await updateDoc(consumerDoc, consumerData)
              } else {
                // Add new consumer
                await addDoc(consumersCollection, consumer)
              }
            }
          }
        } else {
          // Add new driver
          const driverDocRef = await addDoc(driversCollection, driverData)

          if (consumers && consumers.length > 0) {
            const consumersCollection = collection(driverDocRef, 'consumers')
            for (const consumer of consumers) {
              await addDoc(consumersCollection, consumer)
            }
          }
        }
      }
    }
  }

  subscribeToPolly(id: string, callback: (polly: Polly | null) => void) {
    const docRef = doc(db, this.pollyCollection, id)
    const driversCollection = collection(docRef, 'drivers')

    // Listen to changes in the drivers collection
    return onSnapshot(driversCollection, async () => {
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        const driversSnap = await getDocs(driversCollection)
        const drivers = await Promise.all(driversSnap.docs.map(async driverDoc => {
          const consumersCollection = collection(driverDoc.ref, 'consumers')
          const consumersSnap = await getDocs(consumersCollection)
          const consumers = consumersSnap.docs.map(consumerDoc => ({ id: consumerDoc.id, ...consumerDoc.data() }))
          return { id: driverDoc.id, ...driverDoc.data(), consumers } as Driver
        }))
        callback({ ...data, created: data.created?.toDate(), drivers } as Polly)
      } else {
        callback(null)
      }
    })
  }
}

export const dataService = new DataService()
