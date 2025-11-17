import localForage from 'localforage'

/**
 * Notification service for Firestore-based notifications
 * Handles notification permissions and service worker communication
 */

export class NotificationService {
  private static disabled = false
  private static subscriptionChangeCallbacks: (() => void)[] = []

  /**
   * Check if notifications are supported in this browser
   */
  static isSupported(): boolean {
    if (this.disabled) return false
    return 'Notification' in window && 'serviceWorker' in navigator
  }

  /**
   * Register service worker for notifications
   */
  static async registerServiceWorker(): Promise<void> {
    if (!this.isSupported()) return

    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
      console.log('Service Worker registered successfully:', registration)
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
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

       // Store subscription preference locally
       const subscriptions = await this.getSubscriptions()
       if (!subscriptions?.pollyNotifications?.includes(pollyId)) {
         subscriptions.pollyNotifications.push(pollyId)
       }
       await localForage.setItem('carpolly_notifications', subscriptions)

       // Register service worker if not already registered
       await this.registerServiceWorker()

       // Notify service worker of preference change
       this.notifyServiceWorker()

       // Notify subscribers of change
       this.notifySubscriptionChange()

       return true
     } catch (error) {
       console.error('Error subscribing to polly notifications:', error)
       return false
     }
   }

   /**
     * Subscribe to notifications for driver passenger changes
     */
    static async subscribeToDriverPassengers(pollyId: string, driverId: string): Promise<boolean> {
      if (this.disabled || !this.isSupported()) {
        return false
      }

      try {
        const permission = await this.requestPermission()
        if (permission !== 'granted') {
          return false
        }

        // Store subscription preference locally
        const subscriptions = await this.getSubscriptions()
        if (!subscriptions?.driverNotifications?.some(d => d.pollyId === pollyId && d.driverId === driverId)) {
          subscriptions.driverNotifications.push({ pollyId, driverId })
        }
        await localForage.setItem('carpolly_notifications', subscriptions)

        // Register service worker if not already registered
        await this.registerServiceWorker()

        // Notify service worker of preference change
        this.notifyServiceWorker()

        // Notify subscribers of change
        this.notifySubscriptionChange()

        return true
      } catch (error) {
        console.error('Error subscribing to driver passenger notifications:', error)
        return false
      }
    }

  /**
    * Unsubscribe from notifications for a specific polly
    */
   static async unsubscribeFromPolly(pollyId: string): Promise<void> {
     const subscriptions = await this.getSubscriptions()
     const index = subscriptions?.pollyNotifications?.indexOf(pollyId)
     if (index > -1) {
       subscriptions.pollyNotifications.splice(index, 1)
       await localForage.setItem('carpolly_notifications', subscriptions)
       // Notify service worker of preference change
       this.notifyServiceWorker()
       // Notify subscribers of change
       this.notifySubscriptionChange()
     }
   }

   /**
    * Unsubscribe from notifications for driver passenger changes
    */
   static async unsubscribeFromDriverPassengers(pollyId: string, driverId: string): Promise<void> {
     const subscriptions = await this.getSubscriptions()
     const index = subscriptions?.driverNotifications?.findIndex(d => d.pollyId === pollyId && d.driverId === driverId)
     if (index > -1) {
       subscriptions.driverNotifications.splice(index, 1)
       await localForage.setItem('carpolly_notifications', subscriptions)
       // Notify service worker of preference change
       this.notifyServiceWorker()
       // Notify subscribers of change
       this.notifySubscriptionChange()
     }
   }

  /**
    * Check if user is subscribed to a specific polly
    */
   static async isSubscribedToPolly(pollyId: string): Promise<boolean> {
     const subscriptions = await this.getSubscriptions()
     return subscriptions?.pollyNotifications?.includes(pollyId)
   }

   /**
    * Check if user is subscribed to driver passenger changes
    */
   static async isSubscribedToDriverPassengers(pollyId: string, driverId: string): Promise<boolean> {
     const subscriptions = await this.getSubscriptions()
     return subscriptions?.driverNotifications?.some(d => d.pollyId === pollyId && d.driverId === driverId)
   }

  /**
   * Get all notification subscriptions
   */
  private static async getSubscriptions(): Promise<{ pollyNotifications: string[]; driverNotifications: { pollyId: string; driverId: string }[] }> {
    try {
      const stored = await localForage.getItem('carpolly_notifications')
      const subscriptions = stored as { pollyNotifications?: string[]; driverNotifications?: { pollyId: string; driverId: string }[] }
      return {
        pollyNotifications: subscriptions?.pollyNotifications || [],
        driverNotifications: subscriptions?.driverNotifications || []
      }
    } catch {
      return { pollyNotifications: [], driverNotifications: [] }
    }
  }

  /**
   * Notify service worker of preference changes
   */
  private static async notifyServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration.active) {
        registration.active.postMessage({
          type: 'UPDATE_NOTIFICATION_PREFERENCES'
        })
      }
    }
  }

  /**
   * Subscribe to subscription changes
   */
  static onSubscriptionChange(callback: () => void): () => void {
    this.subscriptionChangeCallbacks.push(callback)
    return () => {
      const index = this.subscriptionChangeCallbacks.indexOf(callback)
      if (index > -1) {
        this.subscriptionChangeCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Notify all subscribers of subscription changes
   */
  private static notifySubscriptionChange(): void {
    this.subscriptionChangeCallbacks.forEach(callback => callback())
  }

}
