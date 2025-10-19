/**
 * Notification service for PWA push notifications
 * Handles Firebase Cloud Messaging and notification permissions
 */

import { messaging } from '../src/firebase'
import { getToken, onMessage } from 'firebase/messaging'

export class NotificationService {
  private static vapidKey = import.meta.env.VITE_FCM_VAPID_KEY

  /**
   * Check if notifications are supported in this browser
   */
  static isSupported(): boolean {
    return 'Notification' in window &&
           'serviceWorker' in navigator &&
           messaging !== null
  }

  /**
   * Check if the app is running as a PWA
   */
  static isPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           // eslint-disable-next-line @typescript-eslint/no-explicit-any
           ((window.navigator as any).standalone === true)
  }

  /**
   * Request notification permission from user
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Notifications not supported in this browser')
    }

    const permission = await Notification.requestPermission()
    return permission
  }

  /**
   * Get FCM registration token
   */
  static async getFCMToken(): Promise<string | null> {
    if (!this.isSupported()) {
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
    if (!this.isSupported()) {
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
    if (!this.isPWA()) {
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
   * Check if user is subscribed to a specific polly
   */
  static isSubscribedToPolly(pollyId: string): boolean {
    const subscriptions = this.getSubscriptions()
    return subscriptions[pollyId]?.subscribed === true
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

  /**
   * Show notification settings modal
   */
  static showNotificationModal(pollyId: string, pollyDescription: string): void {
    if (!this.isPWA()) {
      return
    }

    const isSubscribed = this.isSubscribedToPolly(pollyId)

    // Create modal content
    const modalContent = `
      <div class="text-center">
        <i class="bi bi-bell${isSubscribed ? '-fill' : ''} text-primary fs-1 mb-3"></i>
        <h5>Push Notifications</h5>
        <p>Get notified when drivers or passengers join "${pollyDescription}"</p>
        <div class="form-check form-switch mb-3">
          <input class="form-check-input" type="checkbox" id="notification-toggle" ${isSubscribed ? 'checked' : ''}>
          <label class="form-check-label" for="notification-toggle">
            Enable notifications for this polly
          </label>
        </div>
      </div>
    `

    // Create and show modal
    const modal = document.createElement('div')
    modal.innerHTML = `
      <div class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-body p-4">
              ${modalContent}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="save-notification-settings">Save</button>
            </div>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modal)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bsModal = new (window as any).bootstrap.Modal(modal.querySelector('.modal')!)
    bsModal.show()

    // Handle save button
    const saveButton = modal.querySelector('#save-notification-settings') as HTMLButtonElement
    const toggle = modal.querySelector('#notification-toggle') as HTMLInputElement

    saveButton.addEventListener('click', async () => {
      try {
        if (toggle.checked) {
          const success = await this.subscribeToPolly(pollyId)
          if (success) {
            alert('Notifications enabled! You\'ll be notified of changes to this polly.')
          } else {
            alert('Failed to enable notifications. Please check your browser settings.')
          }
        } else {
          this.unsubscribeFromPolly(pollyId)
          alert('Notifications disabled for this polly.')
        }
        bsModal.hide()
      } catch (error) {
        console.error('Error saving notification settings:', error)
        alert('Error saving notification settings.')
      }
    })

    // Clean up modal after it's hidden
    modal.addEventListener('hidden.bs.modal', () => {
      document.body.removeChild(modal)
    })
  }
}
