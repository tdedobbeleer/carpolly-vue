/**
 * Notification service for PWA push notifications
 * Handles Firebase Cloud Messaging and notification permissions
 */

import { messaging } from '../src/firebase'
import { getToken, onMessage } from 'firebase/messaging'

export class NotificationService {
  private static vapidKey = import.meta.env.VITE_FCM_VAPID_KEY
  private static disabled = true

  /**
   * Check if notifications are supported in this browser
   */
  static isSupported(): boolean {
    if (this.disabled) return false
    return 'Notification' in window &&
           'serviceWorker' in navigator &&
           messaging !== null
  }

  /**
   * Check if the app is running as a PWA
   */
  static isPWA(): boolean {
    if (this.disabled) return false
    return window.matchMedia('(display-mode: standalone)').matches ||
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           ((window.navigator as any).standalone === true)
  }

  /**
   * Request notification permission from user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (this.disabled || !this.isSupported()) {
      throw new Error('Notifications not supported in this browser')
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  /**
   * Get FCM registration token
   */
  static async getFCMToken(): Promise<string | null> {
    if (this.disabled || !this.isSupported()) {
      return null
    }

    try {
      const token = await getToken(messaging!, {
        vapidKey: this.vapidKey
      })
      return token
    } catch (error) {
      console.error('Error getting FCM token:', error)
      return null
    }
  }

  /**
   * Initialize notification listeners
   */
  static initializeListeners(): void {
    if (this.disabled || !this.isSupported()) {
      return
    }

    // Listen for foreground messages
    onMessage(messaging!, (payload) => {
      console.log('Message received in foreground:', payload)

      // Show notification if permission granted
      if (Notification.permission === 'granted') {
        const { title, body, icon } = payload.notification || {}
        if (title && body) {
          new Notification(title, {
            body,
            icon: icon || '/logo.png',
            badge: '/favicon-96x96.png',
            tag: payload.data?.tag || 'carpolly-notification'
          })
        }
      }
    })
  }

  /**
    * Subscribe to notifications for a specific polly
    */
   static async subscribeToPolly(pollyId: string): Promise<boolean> {
     if (this.disabled || !this.isSupported()) {
       return false
     }

     try {
       const permission = await this.requestPermission()
       if (permission !== 'granted') {
         return false
       }

       const token = await this.getFCMToken()
       if (!token) {
         return false
       }

       // Store subscription preference locally
       const subscriptions = this.getSubscriptions()
       subscriptions[pollyId] = { token, subscribed: true, timestamp: Date.now() }
       localStorage.setItem('carpolly_notifications', JSON.stringify(subscriptions))

       return true
     } catch (error) {
       console.error('Error subscribing to polly notifications:', error)
       return false
     }
   }

   /**
     * Subscribe to notifications for driver passenger changes
     */
    static async subscribeToDriverPassengers(driverId: string): Promise<boolean> {
      if (this.disabled || !this.isSupported()) {
        return false
      }

     try {
       const permission = await this.requestPermission()
       if (permission !== 'granted') {
         return false
       }

       const token = await this.getFCMToken()
       if (!token) {
         return false
       }

       // Store subscription preference locally
       const subscriptions = this.getSubscriptions()
       subscriptions[`driver_${driverId}`] = { token, subscribed: true, timestamp: Date.now() }
       localStorage.setItem('carpolly_notifications', JSON.stringify(subscriptions))

       return true
     } catch (error) {
       console.error('Error subscribing to driver passenger notifications:', error)
       return false
     }
   }

  /**
    * Unsubscribe from notifications for a specific polly
    */
   static unsubscribeFromPolly(pollyId: string): void {
     const subscriptions = this.getSubscriptions()
     if (subscriptions[pollyId]) {
       delete subscriptions[pollyId]
       localStorage.setItem('carpolly_notifications', JSON.stringify(subscriptions))
     }
   }

   /**
    * Unsubscribe from notifications for driver passenger changes
    */
   static unsubscribeFromDriverPassengers(driverId: string): void {
     const subscriptions = this.getSubscriptions()
     if (subscriptions[`driver_${driverId}`]) {
       delete subscriptions[`driver_${driverId}`]
       localStorage.setItem('carpolly_notifications', JSON.stringify(subscriptions))
     }
   }

  /**
    * Check if user is subscribed to a specific polly
    */
   static isSubscribedToPolly(pollyId: string): boolean {
     const subscriptions = this.getSubscriptions()
     return subscriptions[pollyId]?.subscribed === true
   }

   /**
    * Check if user is subscribed to driver passenger changes
    */
   static isSubscribedToDriverPassengers(driverId: string): boolean {
     const subscriptions = this.getSubscriptions()
     return subscriptions[`driver_${driverId}`]?.subscribed === true
   }

  /**
   * Get all notification subscriptions
   */
  private static getSubscriptions(): Record<string, { token: string; subscribed: boolean; timestamp: number }> {
    try {
      const stored = localStorage.getItem('carpolly_notifications')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

}
