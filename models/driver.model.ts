import type { Consumer } from './consumer.model'

export interface Driver {
  name?: string
  description?: string
  spots?: number
  consumers?: Consumer[]
}