import { ref, onMounted } from 'vue'

const consentGiven = ref(false)
const bannerVisible = ref(false)

export function useCookieConsent() {
  const checkConsent = () => {
    const stored = localStorage.getItem('cookie-consent')
    if (stored === 'accepted') {
      consentGiven.value = true
      bannerVisible.value = false
      enableTracking()
    } else if (stored === 'rejected') {
      consentGiven.value = false
      bannerVisible.value = false
      disableTracking()
    } else {
      bannerVisible.value = true
      disableTracking()
    }
  }

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    consentGiven.value = true
    bannerVisible.value = false
    // Enable GA and reCAPTCHA
    enableTracking()
  }

  const rejectCookies = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    consentGiven.value = false
    bannerVisible.value = false
  }

  const enableTracking = () => {
    // Enable Google Analytics
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      })
    }
    // For reCAPTCHA, if needed, enable here
  }

  const disableTracking = () => {
    // Disable Google Analytics
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied'
      })
    }
    // For reCAPTCHA, if needed, disable here
  }

  onMounted(() => {
    checkConsent()
  })

  return {
    consentGiven,
    bannerVisible,
    acceptCookies,
    rejectCookies
  }
}
