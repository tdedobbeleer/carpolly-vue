importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore-compat.js');
importScripts('https://unpkg.com/localforage@1.10.0/dist/localforage.min.js');

const firebaseConfig = {
  apiKey: "AIzaSyC4yG_GAL-aYJ-OVqC-yDssMfyDGoWdaUQ",
  authDomain: "carpolly.firebaseapp.com",
  projectId: "carpolly-4fe11",
  storageBucket: "carpolly.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:611172017575:web:f0b52a8ace683ec19f8282"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

// Store active listeners to avoid duplicates
const activeListeners = new Map();

// Store previous state to detect changes
const previousStates = new Map();

// Function to get notification preferences from localForage
async function getNotificationPreferences() {
  try {
    const stored = await localforage.getItem('carpolly_notifications');
    return stored || {};
  } catch (error) {
    console.error('Error reading notification preferences:', error);
    return {};
  }
}

// Function to check if we should notify for a polly
async function shouldNotifyForPolly(pollyId) {
  const preferences = await getNotificationPreferences();
  return preferences[pollyId]?.subscribed === true || preferences[`driver_${pollyId}`]?.subscribed === true;
}

// Function to setup polly listener
function setupPollyListener(pollyId) {
  if (activeListeners.has(pollyId)) {
    return; // Already listening
  }

  console.log(`Setting up listener for polly: ${pollyId}`);

  const docRef = db.collection('pollies').doc(pollyId);
  const driversCollection = docRef.collection('drivers');

  // Listen to changes in the drivers collection
  const unsubscribe = driversCollection.onSnapshot(async (driversSnap) => {
    if (!(await shouldNotifyForPolly(pollyId))) {
      return; // User unsubscribed
    }

    const docSnap = await db.collection('pollies').doc(pollyId).get();
    if (docSnap.exists) {
      const data = docSnap.data();
      const previousState = previousStates.get(pollyId);

      // Get current state
      const currentDrivers = await Promise.all(driversSnap.docs.map(async driverDoc => {
        const consumersSnap = await driverDoc.ref.collection('consumers').get();
        const consumers = consumersSnap.docs.map(consumerDoc => ({
          id: consumerDoc.id,
          ...consumerDoc.data()
        }));
        return {
          id: driverDoc.id,
          ...driverDoc.data(),
          consumers
        };
      }));

      const currentState = {
        ...data,
        drivers: currentDrivers
      };

      // Compare with previous state to detect changes
      if (previousState && JSON.stringify(previousState) !== JSON.stringify(currentState)) {
        const pollyDescription = data?.description || 'Carpool';

        // Detect what changed
        let notificationTitle = 'Polly Updated';
        let notificationBody = `${pollyDescription} has been updated`;

        // Check for driver changes
        const prevDrivers = previousState.drivers || [];
        const currDrivers = currentState.drivers || [];

        if (prevDrivers.length !== currDrivers.length) {
          if (currDrivers.length > prevDrivers.length) {
            notificationTitle = 'New Driver Added';
            notificationBody = `A new driver joined ${pollyDescription}`;
          } else {
            notificationTitle = 'Driver Removed';
            notificationBody = `A driver was removed from ${pollyDescription}`;
          }
        } else {
          // Check for consumer changes
          let consumerChanged = false;
          for (let i = 0; i < currDrivers.length; i++) {
            const currDriver = currDrivers[i];
            const prevDriver = prevDrivers.find(d => d.id === currDriver.id);

            if (prevDriver && currDriver.consumers && prevDriver.consumers) {
              if (currDriver.consumers.length !== prevDriver.consumers.length) {
                consumerChanged = true;
                if (currDriver.consumers.length > prevDriver.consumers.length) {
                  notificationTitle = 'Passenger Joined';
                  notificationBody = `Someone joined ${currDriver.name}'s ride in ${pollyDescription}`;
                } else {
                  notificationTitle = 'Passenger Left';
                  notificationBody = `Someone left ${currDriver.name}'s ride in ${pollyDescription}`;
                }
                break;
              }
            }
          }

          // If no consumer changes detected, it might be a driver update
          if (!consumerChanged) {
            notificationTitle = 'Driver Updated';
            notificationBody = `A driver in ${pollyDescription} was updated`;
          }
        }

        // Show notification
        const notificationOptions = {
          body: notificationBody,
          icon: '/logo.png',
          badge: '/favicon-96x96.png',
          tag: `carpolly-${pollyId}`,
          data: { url: `/polly/${pollyId}`, pollyId }
        };

        console.log('Showing notification:', notificationTitle, notificationOptions);
        try {
          await self.registration.showNotification(notificationTitle, notificationOptions);
          console.log('Notification shown successfully');
        } catch (error) {
          console.error('Failed to show notification:', error);
        }
      }

      // Update previous state
      previousStates.set(pollyId, currentState);

      // Set up individual consumer listeners for each driver
      driversSnap.docs.forEach(driverDoc => {
        const consumersCollection = driverDoc.ref.collection('consumers');
        consumersCollection.onSnapshot(async (consumersSnap) => {
          if (!(await shouldNotifyForPolly(pollyId))) {
            return; // User unsubscribed
          }

          // Get current consumer count
          const currentConsumerCount = consumersSnap.docs.length;

          // Get previous consumer count for this driver
          const prevState = previousStates.get(pollyId);
          const prevDriver = prevState?.drivers?.find(d => d.id === driverDoc.id);
          const previousConsumerCount = prevDriver?.consumers?.length || 0;

          if (currentConsumerCount !== previousConsumerCount) {
            const pollyDescription = data?.description || 'Carpool';
            const driverData = driverDoc.data();

            let notificationTitle, notificationBody;
            if (currentConsumerCount > previousConsumerCount) {
              notificationTitle = 'Passenger Joined';
              notificationBody = `Someone joined ${driverData.name}'s ride in ${pollyDescription}`;
            } else {
              notificationTitle = 'Passenger Left';
              notificationBody = `Someone left ${driverData.name}'s ride in ${pollyDescription}`;
            }

            // Show notification
            const notificationOptions = {
              body: notificationBody,
              icon: '/logo.png',
              badge: '/favicon-96x96.png',
              tag: `carpolly-${pollyId}`,
              data: { url: `/polly/${pollyId}`, pollyId }
            };

            console.log('Showing consumer notification:', notificationTitle, notificationOptions);
            try {
              await self.registration.showNotification(notificationTitle, notificationOptions);
              console.log('Consumer notification shown successfully');
            } catch (error) {
              console.error('Failed to show consumer notification:', error);
            }

            // Update the stored state with new consumer count
            if (prevState) {
              const updatedDrivers = prevState.drivers.map(d =>
                d.id === driverDoc.id
                  ? { ...d, consumers: consumersSnap.docs.map(c => ({ id: c.id, ...c.data() })) }
                  : d
              );
              previousStates.set(pollyId, { ...prevState, drivers: updatedDrivers });
            }
          }
        }, (error) => {
          console.error(`Error listening to consumers for driver ${driverDoc.id}:`, error);
        });
      });
    }
  }, (error) => {
    console.error(`Error listening to polly ${pollyId}:`, error);
  });

  // Also listen to polly document changes
  const pollyUnsubscribe = docRef.onSnapshot(async (doc) => {
    if (!(await shouldNotifyForPolly(pollyId))) {
      return; // User unsubscribed
    }

    if (doc.exists) {
      const pollyData = doc.data();
      const pollyDescription = pollyData?.description || 'Carpool';

      // Check if description changed
      const prevState = previousStates.get(pollyId);
      if (prevState && prevState.description !== pollyData?.description) {
        // Show notification for polly description changes
        const notificationTitle = 'Polly Updated';
        const notificationOptions = {
          body: `${pollyDescription} description was updated`,
          icon: '/logo.png',
          badge: '/favicon-96x96.png',
          tag: `carpolly-${pollyId}`,
          data: { url: `/polly/${pollyId}`, pollyId }
        };

        console.log('Showing polly description notification:', notificationTitle, notificationOptions);
        try {
          await self.registration.showNotification(notificationTitle, notificationOptions);
          console.log('Polly description notification shown successfully');
        } catch (error) {
          console.error('Failed to show polly description notification:', error);
        }

        // Update stored state
        const updatedState = { ...prevState, description: pollyData?.description };
        previousStates.set(pollyId, updatedState);
      }
    }
  }, (error) => {
    console.error(`Error listening to polly ${pollyId}:`, error);
  });

  // Store both unsubscribers
  activeListeners.set(pollyId, () => {
    unsubscribe();
    pollyUnsubscribe();
  });
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
async function updateListeners() {
  const preferences = await getNotificationPreferences();

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
self.addEventListener('activate', async () => {
  console.log('Service worker activated, setting up polly listeners');
  await updateListeners();
});

// Listen for messages from the main thread to update preferences
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'UPDATE_NOTIFICATION_PREFERENCES') {
    console.log('Received notification preferences update');
    await updateListeners();
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
