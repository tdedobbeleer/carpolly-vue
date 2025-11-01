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
       const subscriptions = this.getSubscriptions()
       subscriptions[pollyId] = { subscribed: true, timestamp: Date.now() }
       localStorage.setItem('carpolly_notifications', JSON.stringify(subscriptions))

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
    static async subscribeToDriverPassengers(driverId: string): Promise<boolean> {
      if (this.disabled || !this.isSupported()) {
        return false
      }

      try {
        const permission = await this.requestPermission()
        if (permission !== 'granted') {
          return false
        }

        // Store subscription preference locally
        const subscriptions = this.getSubscriptions()
        subscriptions[`driver_${driverId}`] = { subscribed: true, timestamp: Date.now() }
        localStorage.setItem('carpolly_notifications', JSON.stringify(subscriptions))

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
   static unsubscribeFromPolly(pollyId: string): void {
     const subscriptions = this.getSubscriptions()
     if (subscriptions[pollyId]) {
       delete subscriptions[pollyId]
       localStorage.setItem('carpolly_notifications', JSON.stringify(subscriptions))
       // Notify service worker of preference change
       this.notifyServiceWorker()
       // Notify subscribers of change
       this.notifySubscriptionChange()
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
       // Notify service worker of preference change
       this.notifyServiceWorker()
       // Notify subscribers of change
       this.notifySubscriptionChange()
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
   private static getSubscriptions(): Record<string, { subscribed: boolean; timestamp: number }> {
     try {
       const stored = localStorage.getItem('carpolly_notifications')
       return stored ? JSON.parse(stored) : {}
     } catch {
       return {}
     }
   }

  /**
   * Notify service worker of preference changes
   */
  private static notifyServiceWorker(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_NOTIFICATION_PREFERENCES'
      })
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
