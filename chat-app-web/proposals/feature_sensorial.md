# Technical Specification: Sensorial Chat

## 1. Overview
Sensorial Chat introduces a new dimension to user communication by enriching messages with **haptic feedback** (device vibrations) and **dynamic soundscapes** (context-aware audio). Instead of generic notification pings, each message type will have a uniquely mapped sensory experience, improving immersion, accessibility, and emotional connection between users.

## 2. Objectives
- Implement the Web Vibration API for supported devices to provide nuanced haptic feedback.
- Integrate a robust audio engine (e.g., Web Audio API / Howler.js) to play layered, low-latency soundscapes.
- Define a taxonomy of message types and their corresponding sensory mappings.
- Ensure strict user control over sensory features (opt-in/opt-out, volume controls, intensity settings) to respect accessibility and personal preferences.

## 3. Scope
- **In-Scope**: Web client (`chat-app-web`) implementation, mapping for at least 5 distinct message types, user preference toggles.
- **Out-of-Scope**: Mobile-native specific APIs (e.g., iOS CoreHaptics) unless bridged via PWA, custom user-uploaded soundscapes.

## 4. Technical Architecture
### 4.1. Haptic Engine
We will utilize the `Navigator.vibrate()` API available in modern web browsers (primarily Android devices). 
- A dedicated `HapticService` will interpret message metadata and trigger specific millisecond arrays (patterns).
- Fallback mechanisms will be implemented for unsupported browsers (e.g., iOS Safari currently does not support the Web Vibration API, so it will gracefully degrade to audio-only or visual feedback).

### 4.2. Audio Engine
- We will use **Howler.js** to manage audio assets. It provides a reliable abstraction over the Web Audio API and HTML5 Audio.
- Audio assets will be combined into an **audio sprite** to minimize HTTP requests and reduce latency.
- A `SoundscapeService` will handle playback, volume normalization, and spatial panning if necessary.

## 5. Message Types & Sensory Mapping

| Message Type | Visual Cue | Haptic Pattern (ms) | Soundscape Profile |
| :--- | :--- | :--- | :--- |
| **Standard Text** | Default Bubble | `[50]` (Subtle tick) | Soft 'pop' or paper rustle |
| **Urgent/Priority** | Red Outline | `[100, 50, 100, 50, 100]` (Rapid pulse) | Sharp, resonant chime |
| **Heart/Love** | Floating Hearts | `[200, 100, 200]` (Heartbeat) | Warm, low-frequency synth pad |
| **Celebration** | Confetti | `[50, 50, 50, 50, 200]` (Drumroll) | Bright xylophone sweep |
| **Payment/Money** | Green Hue | `[150]` (Solid thud) | Coin jingle or crisp paper snap |

## 6. Implementation Details
### 6.1. State Management & Preferences
We must add a `SensoryPreferences` object to the user's settings store:
```typescript
interface SensoryPreferences {
  hapticsEnabled: boolean;
  soundscapesEnabled: boolean;
  masterVolume: number; // 0.0 to 1.0
  quietHours: { enabled: boolean; start: string; end: string; };
}
```

### 6.2. Event Interception
When a message is received via WebSockets:
1. Parse `message.metadata.type`.
2. Check `SensoryPreferences`.
3. If allowed, invoke `HapticService.play(type)` and `SoundscapeService.play(type)`.

## 7. Accessibility & UX Considerations
- **Default State**: Sensory features should be **opt-in** or easily discoverable to disable. Unsolicited audio/haptics can be jarring or triggering for certain neurodivergent users.
- **Visual Alternatives**: Every sensory cue MUST have a distinct visual equivalent (e.g., animations, color changes) for deaf or hard-of-hearing users, and users with haptics disabled.

## 8. Future Extensions
- **Spatial Audio**: Panning audio based on where the message appears on screen or the sender's configured location.
- **Generative Soundscapes**: Procedurally generated audio based on the sentiment analysis of the text.
- **Custom Sensory Profiles**: Allowing users to define their own vibration patterns or choose from theme packs.
