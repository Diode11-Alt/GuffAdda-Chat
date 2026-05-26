# Technical Specification: AI Auto-Complete & Smart Replies

## 1. Overview
This feature introduces AI-powered auto-complete and smart reply suggestions to the chat application. To maintain strict privacy and security guarantees, inference will run **locally in the browser** using WebGPU. No message data will be sent to external AI providers.

## 2. Objectives
*   **Privacy-First:** All text generation happens on the client device.
*   **Low Latency:** Provide instant suggestions without network round-trips.
*   **Smart Replies:** Generate context-aware quick reply chips based on recent conversation history.
*   **Auto-Complete:** Provide inline ghost-text predictions as the user types.

## 3. Technology Stack
*   **Inference Engine:** [Transformers.js](https://huggingface.co/docs/transformers.js/) or [MLC LLM (WebGPU)](https://llm.mlc.ai/)
*   **Hardware Acceleration:** WebGPU API (with fallback to WebGL/WASM where WebGPU is unsupported).
*   **Models:**
    *   *Smart Replies:* Small, highly quantized models (e.g., Llama 3 8B 4-bit, Phi-3 Mini 4k, or Gemma-2b-it) tailored for conversational context.
    *   *Auto-Complete:* Extremely lightweight models (e.g., TinyLlama 1.1B, Qwen1.5-0.5B) optimized for fast token-by-token generation.
*   **Worker:** Web Workers to offload inference from the main UI thread.

## 4. Architecture
### 4.1. The LLM Worker
Inference will be isolated in a dedicated Web Worker (`llm-worker.ts`) to prevent UI blocking.
1.  **Main Thread:** Captures input (keystrokes, incoming messages) and posts messages to the worker.
2.  **Web Worker:** Loads the model via IndexedDB cache, processes the prompt, runs inference via WebGPU, and streams tokens back to the main thread.

### 4.2. Storage & Caching
*   Model weights (often 1GB - 3GB) will be downloaded once and cached locally using the Cache API or IndexedDB.
*   A progress indicator will be shown during the initial model download.

## 5. Feature Details
### 5.1. Smart Replies
*   **Trigger:** When a new message is received in an active chat.
*   **Context:** The last 5-10 messages of the conversation.
*   **Output:** 3 short, contextually appropriate response options displayed above the message input field.
*   **Prompt Template:** `[System: Generate 3 brief, natural replies to the conversation] [History: ...] [User's turn]`

### 5.2. Auto-Complete (Ghost Text)
*   **Trigger:** As the user types in the message input field (debounced by ~300ms).
*   **Context:** The current drafted text + recent conversation history.
*   **Output:** Predicted completion rendered as muted/ghost text ahead of the cursor.
*   **Interaction:** Pressing `Tab` or `Right Arrow` accepts the suggestion.

## 6. Performance & Constraints
*   **Memory Limit:** Browsers may restrict WebAssembly/WebGPU memory. We will target 4-bit quantization to fit models within 1-2GB of VRAM.
*   **Initial Load Time:** The first load requires downloading the model. We will implement a background download manager and allow users to opt-in to this feature.
*   **Battery Drain:** Continuous inference can be power-intensive. Auto-complete will be paused when battery is low or the device is in low-power mode.

## 7. Implementation Roadmap
1.  **Phase 1: R&D & Benchmarking:** Test Transformers.js and WebGPU with various sub-3B parameter models on target browsers (Chrome/Edge/Safari).
2.  **Phase 2: Worker Integration:** Set up the Web Worker architecture and message passing. Implement model caching.
3.  **Phase 3: Smart Replies UI:** Build the UI components for displaying and accepting smart replies.
4.  **Phase 4: Auto-Complete UI:** Implement the ghost-text overlay in the message input component.
5.  **Phase 5: Optimization:** Tune prompts, adjust quantization, and implement power-saving heuristics.

## 8. Security Considerations
*   Since the models run entirely locally, there is zero risk of message contents being intercepted by a third-party AI API.
*   Models must be fetched from a trusted, verified source (e.g., our own CDN) to prevent prompt injection or malicious weight manipulation.
