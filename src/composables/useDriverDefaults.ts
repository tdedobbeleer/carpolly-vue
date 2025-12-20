import { ref, readonly } from 'vue'

// Driver defaults interface
export interface DriverDefaults {
  description: string
  spots: number
}

// Default driver defaults
const defaultDefaults: DriverDefaults = {
  description: '',
  spots: 1
}

// Reactive driver defaults
const driverDefaults = ref<DriverDefaults>({ ...defaultDefaults })

// Local storage key
const STORAGE_KEY = 'carpolly-driver-defaults'

/**
 * Composable for managing driver default settings
 * Provides reactive access to driver's default description and spots stored in localStorage
 */
export function useDriverDefaults() {
  // Load defaults from localStorage
  const loadDefaults = () => {
    try {
      const savedDefaults = localStorage.getItem(STORAGE_KEY)
      if (savedDefaults) {
        const parsed = JSON.parse(savedDefaults)
        driverDefaults.value = { ...defaultDefaults, ...parsed }
      }
    } catch (error) {
      console.error('Error loading driver defaults:', error)
    }
  }

  // Save defaults to localStorage
  const saveDefaults = (defaults: DriverDefaults) => {
    try {
      driverDefaults.value = { ...defaults }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(driverDefaults.value))
      return true
    } catch (error) {
      console.error('Error saving driver defaults:', error)
      throw error
    }
  }

  // Update description
  const updateDescription = (description: string) => {
    const defaults = { ...driverDefaults.value, description }
    return saveDefaults(defaults)
  }

  // Update spots
  const updateSpots = (spots: number) => {
    const defaults = { ...driverDefaults.value, spots }
    return saveDefaults(defaults)
  }

  // Get description
  const getDescription = () => {
    return driverDefaults.value.description
  }

  // Get spots
  const getSpots = () => {
    return driverDefaults.value.spots
  }

  // Clear defaults data
  const clearDefaults = () => {
    try {
      driverDefaults.value = { ...defaultDefaults }
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing driver defaults:', error)
    }
  }

  // Initialize defaults on first use
  loadDefaults()

  return {
    // Reactive defaults data
    driverDefaults: readonly(driverDefaults),

    // Methods
    loadDefaults,
    saveDefaults,
    updateDescription,
    updateSpots,
    getDescription,
    getSpots,
    clearDefaults
  }
}

// Export default for convenience
export default useDriverDefaults
