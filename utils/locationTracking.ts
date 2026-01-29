
import * as Location from 'expo-location';
import { authenticatedPost } from './api';

let locationSubscription: Location.LocationSubscription | null = null;
let isTracking = false;

export const startLocationTracking = async (shiftId: string): Promise<boolean> => {
  if (isTracking) {
    console.log('Location tracking already active');
    return true;
  }

  try {
    // Request permissions
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.error('Foreground location permission denied');
      return false;
    }

    // Request background permissions (optional, but recommended)
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('Background location permission denied - tracking will only work in foreground');
    }

    console.log('Starting location tracking for shift:', shiftId);

    // Start tracking
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // Update every 30 seconds
        distanceInterval: 50, // Or when moved 50 meters
      },
      async (location) => {
        console.log('Location update:', location.coords);
        
        try {
          await authenticatedPost('/api/location/update', {
            shiftId,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: new Date(location.timestamp).toISOString(),
          });
          console.log('Location sent to server');
        } catch (error) {
          console.error('Error sending location update:', error);
        }
      }
    );

    isTracking = true;
    console.log('Location tracking started successfully');
    return true;
  } catch (error) {
    console.error('Error starting location tracking:', error);
    return false;
  }
};

export const stopLocationTracking = async (): Promise<void> => {
  if (!isTracking) {
    console.log('Location tracking not active');
    return;
  }

  try {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
    isTracking = false;
    console.log('Location tracking stopped');
  } catch (error) {
    console.error('Error stopping location tracking:', error);
  }
};

export const isLocationTrackingActive = (): boolean => {
  return isTracking;
};
