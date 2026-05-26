# Technical Specification: AR/Spatial Profiles

## 1. Overview
The AR/Spatial Profiles feature aims to replace traditional, static 2D user profiles with immersive, interactive 3D representations. By leveraging device sensors (gyroscope, accelerometer, camera depth sensors) and WebXR/ARKit/ARCore, users will experience a sense of spatial presence. Profile avatars and environments will react to device movement, creating a parallax effect and a tangible sense of depth, bridging the gap between flat chat interfaces and the spatial web.

## 2. Objectives
- **Immersive Presence:** Create a 3D profile view that responds to the viewer's device motion.
- **Dynamic Avatars:** Support 3D avatars (e.g., GLTF/GLB models) that can animate or reflect real-time or pre-recorded user states.
- **Cross-Platform Compatibility:** Ensure graceful degradation. High-end devices get full AR/Spatial experiences; lower-end devices get fallback 3D or 2D interactions.
- **Privacy-First:** Ensure sensor data is processed locally where possible and explicit consent is obtained for any shared spatial data.

## 3. User Experience (UX)
### 3.1 Viewing a Profile
- **Spatial Parallax:** When a user opens a profile on a mobile device, tilting the device shifts the camera perspective around the 3D avatar and environment.
- **Spatial Audio:** If the user has a profile audio snippet, its volume and panning adjust based on the orientation of the 3D model relative to the viewer's viewport.
- **Interactivity:** Users can swipe to rotate the avatar or pinch to zoom into details of the spatial profile environment.

### 3.2 Creating a Profile
- Users can upload a 3D avatar (GLB format) or use an in-app avatar generator.
- Users can scan their physical environment or an object using LiDAR/ARKit to use as a 3D profile background.
- Users can define the baseline "idle" animations for their avatar.

## 4. Architecture & Technology Stack

### 4.1 Frontend (Web/Mobile Web)
- **3D Engine:** Three.js wrapped in React Three Fiber (@react-three/fiber).
- **AR/VR APIs:** WebXR Device API for immersive sessions.
- **Sensor Access:** `DeviceOrientationEvent` and `DeviceMotionEvent` for web-based parallax effects.
- **Assets:** GLTF/GLB format for models (optimized with Draco compression).

### 4.2 Native Apps (Future iOS/Android)
- **iOS:** RealityKit / ARKit.
- **Android:** ARCore / Sceneform.

### 4.3 Backend & Storage
- **Storage:** Cloud Object Storage (e.g., AWS S3, Firebase Storage) for hosting GLB files, environmental maps (HDRI), and texture assets.
- **CDN:** Aggressive caching via CDN to ensure large 3D assets load instantly.
- **Database:** Profile schema extended to include 3D asset URIs and spatial configuration metadata.

## 5. Data Model

### Profile Extension (JSON Schema)
```json
{
  "userId": "string",
  "spatialProfile": {
    "avatarUrl": "string (URL to .glb)",
    "environmentMapUrl": "string (URL to .hdr)",
    "scale": "number",
    "positionOffset": { "x": 0, "y": 0, "z": 0 },
    "animations": {
      "idle": "string (animation name)",
      "greeting": "string (animation name)"
    },
    "features": {
      "enableParallax": "boolean",
      "enableSpatialAudio": "boolean"
    }
  }
}
```

## 6. Security & Privacy
- **Sensor Data:** `DeviceOrientation` requires user gesture and explicit permission on modern browsers (e.g., iOS Safari). We must prompt the user before requesting sensor access.
- **Data Transmission:** Sensor data used for viewing profiles should remain local to the viewer's device. We do not transmit the viewer's gyroscope data to the backend.
- **Asset Moderation:** 3D models uploaded by users must be scanned for malicious payloads within the GLTF file structure and subject to visual moderation.

## 7. Implementation Phases
- **Phase 1: 3D Canvas Foundation.** Integrate React Three Fiber. Allow users to select pre-made 3D avatars. Implement basic touch-to-rotate functionality.
- **Phase 2: Sensor Integration.** Implement `DeviceOrientationEvent` to drive camera position for the parallax effect. Add permission request flows.
- **Phase 3: Custom Assets & Environments.** Allow users to upload their own GLB files. Introduce spatial audio snippets.
- **Phase 4: Full AR/WebXR.** Allow users to project the profile avatar into their real-world environment using their camera (AR mode).

## 8. Open Questions
- **Performance:** How will 3D profiles impact battery life and render performance on low-end mobile devices? We need a strict polygon count limit.
- **Asset Pipeline:** Should we implement an automated compression pipeline (e.g., auto-converting uploaded models to Draco-compressed GLB) on the backend?
- **Avatar Standardization:** Should we integrate with standard avatar providers like Ready Player Me to simplify creation?
