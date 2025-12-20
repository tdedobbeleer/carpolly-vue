import { ref, computed, readonly } from 'vue'

// User profile interface
export interface UserProfile {
  name: string
}

// Default user profile
const defaultProfile: UserProfile = {
  name: ''
}

// Reactive user profile
const userProfile = ref<UserProfile>({ ...defaultProfile })

// Local storage key
const STORAGE_KEY = 'carpolly-user-profile'

/**
 * Composable for managing user profile data
 * Provides reactive access to user's name stored in localStorage
 */
export function useUserProfile() {
  // Load profile from localStorage
  const loadProfile = () => {
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEY)
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile)
        userProfile.value = { ...defaultProfile, ...parsed }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  // Save profile to localStorage
  const saveProfile = (profile: UserProfile) => {
    try {
      // Validate name
      if (profile.name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters long')
      }

      if (profile.name.trim().length > 50) {
        throw new Error('Name must be less than 50 characters')
      }

      userProfile.value = { ...profile }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile.value))
      return true
    } catch (error) {
      console.error('Error saving user profile:', error)
      throw error
    }
  }

  // Update just the name
  const updateName = (name: string) => {
    const profile = { ...userProfile.value, name }
    return saveProfile(profile)
  }



  // Get the user's name (with fallback)
  const getUserName = (fallback: string = 'Anonymous') => {
    return userProfile.value.name?.trim() || fallback
  }



  // Check if profile is complete (has both name and email)
  const isProfileComplete = computed(() => {
    return userProfile.value.name.trim().length >= 2 &&
           userProfile.value.name.trim().length <= 50
  })

  // Check if name is valid
  const isNameValid = (name?: string) => {
    const nameToCheck = name || userProfile.value.name
    return nameToCheck.trim().length >= 2 && nameToCheck.trim().length <= 50
  }

  // Clear profile data
  const clearProfile = () => {
    try {
      userProfile.value = { ...defaultProfile }
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing user profile:', error)
    }
  }

  // Initialize profile on first use
  loadProfile()

  return {
    // Reactive profile data
    userProfile: readonly(userProfile),

    // Computed properties
    isProfileComplete,

    // Methods
    loadProfile,
    saveProfile,
    updateName,
    getUserName,
    isNameValid,
    clearProfile
  }
}

// Export default for convenience
export default useUserProfile
