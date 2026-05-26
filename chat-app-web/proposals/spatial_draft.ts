import { useState, useEffect, useCallback } from 'react';

export interface DeviceOrientation {
  alpha: number | null; // Z-axis rotation [0, 360)
  beta: number | null;  // X-axis rotation [-180, 180)
  gamma: number | null; // Y-axis rotation [-90, 90)
  absolute: boolean;
}

export interface SpatialTrackingOptions {
  requestPermission?: boolean;
}

/**
 * Hook to access raw DeviceOrientation data.
 */
export function useDeviceOrientation(options: SpatialTrackingOptions = {}) {
  const [orientation, setOrientation] = useState<DeviceOrientation>({
    alpha: null,
    beta: null,
    gamma: null,
    absolute: false,
  });
  const [error, setError] = useState<Error | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const requestAccess = useCallback(async () => {
    // Check if the browser requires explicit permission (e.g., iOS 13+)
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
        } else {
          setPermissionGranted(false);
          setError(new Error('Permission denied for device orientation.'));
        }
      } catch (err) {
        setError(err as Error);
        setPermissionGranted(false);
      }
    } else {
      // Non-iOS 13+ devices typically don't require this explicit request
      setPermissionGranted(true);
    }
  }, []);

  useEffect(() => {
    if (options.requestPermission && permissionGranted === null) {
      requestAccess();
    }
  }, [options.requestPermission, permissionGranted, requestAccess]);

  useEffect(() => {
    if (permissionGranted === false) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute,
      });
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [permissionGranted]);

  return { orientation, error, requestAccess, permissionGranted };
}

/**
 * Hook to calculate 3D tilt percentages based on orientation for UI effects.
 * Normalizes tilt to a range of [-1, 1] based on a maximum tilt limit.
 */
export function useSpatialTilt(maxTilt = 30, options: SpatialTrackingOptions = {}) {
  const { orientation, error, requestAccess, permissionGranted } = useDeviceOrientation(options);
  
  // Normalize beta (front-to-back tilt) and gamma (left-to-right tilt)
  // Results are clamped between -1 and 1
  const tiltX = orientation.gamma ? Math.max(-1, Math.min(1, orientation.gamma / maxTilt)) : 0;
  const tiltY = orientation.beta ? Math.max(-1, Math.min(1, orientation.beta / maxTilt)) : 0;
  
  return { 
    tiltX, 
    tiltY, 
    orientation, 
    error, 
    requestAccess, 
    permissionGranted 
  };
}
