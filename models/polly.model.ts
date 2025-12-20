import type { Driver } from './driver.model'
import type { Consumer } from './consumer.model'

export interface Polly {
  description?: string
  drivers?: Driver[]
  consumers?: Consumer[]
  created?: Date
  updatedAt?: Date
}
