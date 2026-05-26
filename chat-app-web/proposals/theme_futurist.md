# UI Proposal: Futurist (Cyberpunk Theme)

## Overview
A high-contrast, immersive cyberpunk-inspired theme designed to evoke a sophisticated sci-fi terminal or hacking interface. This theme prioritizes data visualization, sharp angular geometry, and striking neon accents against deep, abyssal backgrounds, transforming the chatting application into an advanced tactical communication hub.

## Color Palette
The color scheme relies on an ultra-dark canvas to allow neon accents to glow and signify interactive or important elements.

*   **Primary Background:** Deep Void (`#050505`) - Barely off-black to reduce eye strain while maintaining a stark contrast.
*   **Secondary Background:** Carbon (`#121212`) - Used for elevated surfaces, sidebars, and message cards.
*   **Primary Accent:** Neon Cyan (`#00F3FF`) - Used for primary actions, active states, and user messages.
*   **Secondary Accent:** Hot Magenta (`#FF00E6`) - Used for notifications, unread indicators, and critical alerts.
*   **Tertiary Accent:** Toxic Green (`#39FF14`) - Used for online status indicators and success states.
*   **Text (Primary):** Ice White (`#E0E6ED`) - High legibility on dark backgrounds.
*   **Text (Secondary/Muted):** Steel Gray (`#6C7A89`) - For timestamps and secondary metadata.

## Typography
Typography must feel technical, precise, and slightly utilitarian.

*   **Headings & Display:** `Rajdhani` or `Orbitron` - Squarish, futuristic, and highly stylized for headers, usernames, and prominent UI labels.
*   **Body Text:** `Inter` or `Space Grotesk` - Clean, geometric sans-serifs for highly readable message content.
*   **Code & Metadata:** `Fira Code` or `JetBrains Mono` - Monospaced fonts for timestamps, IDs, and terminal-like logs.

## UI Elements & Aesthetics
The physical properties of the interface should mimic advanced HUDs (Heads Up Displays).

*   **Containers & Borders:** Sharp, 45-degree angled corners (chamfered edges) instead of rounded borders. Thin (`1px`), glowing borders using `box-shadow` or `drop-shadow` filters.
*   **Surfaces:** Translucent, glassmorphic panels with heavy background blur to simulate depth, overlaid with subtle scanline patterns or grid textures.
*   **Buttons:** Hollow outlines that fill with solid neon colors on hover, accompanied by a slight horizontal displacement or "glitch" effect.
*   **Avatars:** Hexagonal or octagonal cutouts rather than standard circles, outlined in the user's current status color.

## Data Visualization Integration
Data shouldn't just be listed; it should be visualized.

*   **Server/Chat Activity:** Real-time mini sparkline graphs behind channel names indicating message volume.
*   **User Profiles:** Radar charts or hexagonal stat webs displaying user activity (e.g., messages sent, time online, reactions given).
*   **System Status:** A persistent, terminal-style ticker tape at the bottom of the screen showing connection status, ping, and encrypted handshakes in a monospaced green font.

## Micro-Interactions & Animation
Animations should feel electrical, instantaneous, and slightly unstable.

*   **Loading States:** "Decrypting..." text effects where randomized characters rapidly cycle before revealing the actual text.
*   **Transitions:** Brief, simulated CRT screen flickers or RGB split "glitch" effects when navigating between major views.
*   **Hover States:** Elements illuminate with a blooming neon glow when hovered, accompanied by a very subtle, low-frequency hum (if audio cues are desired) or a scanning laser line passing over the element.
