import React, { createContext, useContext, useCallback, useRef } from 'react';

// --- Types ---

export type HapticPattern = 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy' | 'selection';
export type AudioSound = 'messageReceived' | 'messageSent' | 'typing' | 'notification' | 'error';

export interface FeedbackEngineContextType {
  playHaptic: (pattern: HapticPattern) => void;
  playAudio: (sound: AudioSound) => void;
  isHapticEnabled: boolean;
  isAudioEnabled: boolean;
  setHapticEnabled: (enabled: boolean) => void;
  setAudioEnabled: (enabled: boolean) => void;
}

// --- Context ---

const FeedbackEngineContext = createContext<FeedbackEngineContextType | null>(null);

// --- Provider ---

interface FeedbackEngineProviderProps {
  children: React.ReactNode;
  initialHapticEnabled?: boolean;
  initialAudioEnabled?: boolean;
}

export const FeedbackEngineProvider: React.FC<FeedbackEngineProviderProps> = ({
  children,
  initialHapticEnabled = true,
  initialAudioEnabled = true,
}) => {
  const [isHapticEnabled, setHapticEnabled] = React.useState(initialHapticEnabled);
  const [isAudioEnabled, setAudioEnabled] = React.useState(initialAudioEnabled);

  // Audio elements refs or Web Audio API context can be stored here
  const audioRefs = useRef<Record<AudioSound, HTMLAudioElement | null>>({
    messageReceived: null,
    messageSent: null,
    typing: null,
    notification: null,
    error: null,
  });

  // Example implementation of haptic feedback using the Navigator.vibrate API
  const playHaptic = useCallback((pattern: HapticPattern) => {
    if (!isHapticEnabled || typeof navigator === 'undefined' || !navigator.vibrate) {
      return;
    }

    // Typical vibration patterns (durations in ms)
    switch (pattern) {
      case 'success':
        navigator.vibrate([15, 100, 15]);
        break;
      case 'warning':
        navigator.vibrate([30, 50, 30]);
        break;
      case 'error':
        navigator.vibrate([50, 50, 50, 50, 50]);
        break;
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(40);
        break;
      case 'selection':
        navigator.vibrate(5);
        break;
    }
  }, [isHapticEnabled]);

  // Example implementation of audio playback
  const playAudio = useCallback((sound: AudioSound) => {
    if (!isAudioEnabled) return;
    
    // In a real implementation, you would load audio files and play them.
    // This is a placeholder for the actual audio playback logic.
    console.log(`[Audio Engine] Playing sound: ${sound}`);
    const audioElement = audioRefs.current[sound];
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement.play().catch(e => console.error('Audio play failed:', e));
    }
  }, [isAudioEnabled]);

  const value = React.useMemo(() => ({
    playHaptic,
    playAudio,
    isHapticEnabled,
    isAudioEnabled,
    setHapticEnabled,
    setAudioEnabled,
  }), [playHaptic, playAudio, isHapticEnabled, isAudioEnabled]);

  return (
    <FeedbackEngineContext.Provider value={value}>
      {children}
    </FeedbackEngineContext.Provider>
  );
};

// --- Hooks ---

/**
 * Hook to access the full Feedback Engine (both audio and haptics)
 */
export const useFeedbackEngine = (): FeedbackEngineContextType => {
  const context = useContext(FeedbackEngineContext);
  if (!context) {
    throw new Error('useFeedbackEngine must be used within a FeedbackEngineProvider');
  }
  return context;
};

/**
 * Convenience hook specifically for haptic feedback
 */
export const useHaptics = () => {
  const { playHaptic, isHapticEnabled, setHapticEnabled } = useFeedbackEngine();
  return { playHaptic, isHapticEnabled, setHapticEnabled };
};

/**
 * Convenience hook specifically for audio feedback
 */
export const useAudio = () => {
  const { playAudio, isAudioEnabled, setAudioEnabled } = useFeedbackEngine();
  return { playAudio, isAudioEnabled, setAudioEnabled };
};
