importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",
  authDomain: "carpolly.firebaseapp.com",
  projectId: "carpolly",
  storageBucket: "carpolly.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// Store active listeners to avoid duplicates
const activeListeners = new Map();

// Function to get notification preferences from localStorage
function getNotificationPreferences() {
  try {
    const stored = localStorage.getItem('carpolly_notifications');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading notification preferences:', error);
    return {};
  }
}

// Function to check if we should notify for a polly
function shouldNotifyForPolly(pollyId) {
  const preferences = getNotificationPreferences();
  return preferences[pollyId]?.subscribed === true || preferences[`driver_${pollyId}`]?.subscribed === true;
}

// Function to setup polly listener
function setupPollyListener(pollyId) {
  if (activeListeners.has(pollyId)) {
    return; // Already listening
  }

  console.log(`Setting up listener for polly: ${pollyId}`);

  const unsubscribe = db.collection('pollies').doc(pollyId).onSnapshot((doc) => {
    if (!shouldNotifyForPolly(pollyId)) {
      return; // User unsubscribed
    }

    if (doc.exists) {
      const data = doc.data();
      const pollyDescription = data?.description || 'Carpool';

      // Show notification for polly changes
      const notificationTitle = 'Polly Updated';
      const notificationOptions = {
        body: `${pollyDescription} has been updated`,
        icon: '/logo.png',
        badge: '/favicon-96x96.png',
        tag: `carpolly-${pollyId}`,
        data: { url: `/polly/${pollyId}`, pollyId }
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    }
  }, (error) => {
    console.error(`Error listening to polly ${pollyId}:`, error);
  });

  activeListeners.set(pollyId, unsubscribe);
}

// Function to remove polly listener
function removePollyListener(pollyId) {
  const unsubscribe = activeListeners.get(pollyId);
  if (unsubscribe) {
    unsubscribe();
    activeListeners.delete(pollyId);
    console.log(`Removed listener for polly: ${pollyId}`);
  }
}

// Function to update listeners based on current preferences
function updateListeners() {
  const preferences = getNotificationPreferences();

  // Get all polly IDs we should be listening to
  const pollyIds = new Set();

  Object.keys(preferences).forEach(key => {
    if (preferences[key]?.subscribed === true) {
      if (key.startsWith('driver_')) {
        // For driver notifications, we still listen to the polly
        const pollyId = key.replace('driver_', '');
        pollyIds.add(pollyId);
      } else {
        pollyIds.add(key);
      }
    }
  });

  // Remove listeners for pollys we no longer care about
  activeListeners.forEach((_, pollyId) => {
    if (!pollyIds.has(pollyId)) {
      removePollyListener(pollyId);
    }
  });

  // Add listeners for new pollys
  pollyIds.forEach(pollyId => {
    if (!activeListeners.has(pollyId)) {
      setupPollyListener(pollyId);
    }
  });
}

// Initialize listeners on service worker start
self.addEventListener('activate', () => {
  console.log('Service worker activated, setting up polly listeners');
  updateListeners();
});

// Listen for messages from the main thread to update preferences
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_NOTIFICATION_PREFERENCES') {
    console.log('Received notification preferences update');
    updateListeners();
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.', event);

  event.notification.close();

  // Handle the click
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
