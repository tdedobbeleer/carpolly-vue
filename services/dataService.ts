import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../src/firebase'
import type { Polly } from '../models/polly.model'

class DataService {
  private pollyCollection = 'pollys'

  async createPolly(id: string, polly: Polly) {
    const docRef = doc(db, this.pollyCollection, id)
    polly.created = serverTimestamp()
    await setDoc(docRef, polly, { merge: false })
  }

  async getPolly(id: string) {
    const docRef = doc(db, this.pollyCollection, id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data() as Polly
    } else {
      throw new Error('Polly not found')
    }
  }

  async updatePolly(id: string, polly: Partial<Polly>) {
    const docRef = doc(db, this.pollyCollection, id)
    await setDoc(docRef, polly, { merge: true })
  }

  subscribeToPolly(id: string, callback: (polly: Polly | null) => void) {
    const docRef = doc(db, this.pollyCollection, id)
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Polly)
      } else {
        callback(null)
      }
    })
  }
}

export const dataService = new DataService()