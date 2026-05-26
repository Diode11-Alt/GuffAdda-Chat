# Brutalist Terminal-Style Chat App Theme

## 1. Overview
This proposal outlines a UI/UX design for a chat application that embraces a "Brutalist Terminal" aesthetic. The design prioritizes raw functionality, high contrast, bold typography, and extreme minimalism. It deliberately avoids generic "modern" UI conventions (soft shadows, rounded corners, subtle gradients) in favor of a striking, unapologetic, and highly legible interface reminiscent of classic command-line environments, but modernized for web readability.

## 2. Core Philosophy
- **Subtraction over Addition**: Remove all non-essential visual elements. If it doesn't serve a structural or communicative purpose, it gets cut.
- **Raw & Exposed**: Borders are harsh, colors are absolute, and structure is visible.
- **Information Density**: Maximize the visibility of the conversation while maintaining clear hierarchy through typography.

## 3. Typography
Typography is the primary design element in this theme. We will mix a harsh monospace font for structural elements with a highly legible sans-serif for reading.

- **Primary Font (Headers, UI Elements, Metadata)**: `JetBrains Mono` or `Space Mono`. This reinforces the terminal aesthetic and provides rigid structure.
- **Secondary Font (Message Bodies)**: `Inter` or `Helvetica Neue` (with tight tracking). We use a sans-serif for message bodies to ensure readability over long sessions, contrasting sharply with the monospace UI elements.
- **Hierarchy**:
  - `H1` (App Title/Current Channel): Monospace, ALL CAPS, 24px, Bold.
  - `H2` (Section Headers): Monospace, ALL CAPS, 14px, Bold, tracking: 0.1em.
  - `Body` (Messages): Sans-serif, 16px, Regular, Line-height: 1.5.
  - `Small/Meta` (Timestamps, Usernames): Monospace, 12px, Regular, uppercase.

## 4. Color Palette
The palette is extremely constrained, relying on maximum contrast. No subtle shades.

### Dark Mode (Default)
- **Background**: `#000000` (Pure Black)
- **Foreground (Text)**: `#FFFFFF` (Pure White)
- **Accent 1 (Primary Action/System Messages)**: `#00FF00` (Terminal Green)
- **Accent 2 (Alerts/Errors)**: `#FF0000` (Pure Red)
- **Borders/Dividers**: `#333333` (Dark Gray)
- **Selection/Highlight**: `#FFFFFF` (White background, Black text)

### Light Mode (High Contrast)
- **Background**: `#FFFFFF` (Pure White)
- **Foreground (Text)**: `#000000` (Pure Black)
- **Accent 1**: `#0000FF` (Pure Blue)
- **Accent 2**: `#FF0000` (Pure Red)
- **Borders/Dividers**: `#CCCCCC` (Light Gray)
- **Selection/Highlight**: `#000000` (Black background, White text)

## 5. Layout & Spacing
- **Grids & Borders**: The layout uses a strict grid. Every major section (sidebar, chat area, input area) is separated by a 1px solid border (`#333333` in dark mode).
- **Padding**: Spacing is asymmetrical but intentional. Tight padding inside messages, generous padding between major layout containers.
- **No Rounded Corners**: `border-radius: 0;` globally. Everything is a sharp rectangle.
- **Shadows**: Hard, solid shadows only (e.g., `box-shadow: 4px 4px 0px 0px #FFFFFF;`) for floating elements like modals or popovers, never soft blur shadows.

## 6. UI Components

### 6.1. Buttons
- **Style**: Solid 1px border. Transparent background. Monospace text, ALL CAPS.
- **Hover State**: Invert colors (Background becomes white, text becomes black). Instant transition, no easing.
- **Active State**: Translate X/Y by 2px (simulating a physical press down).

### 6.2. Chat Input
- **Style**: A single-line textarea at the bottom of the screen. No surrounding box, just a 1px top border separating it from the message list.
- **Prompt**: Prefix the input with a terminal-style prompt: `> _` (where `_` is a blinking cursor).
- **Focus**: When focused, the left border or the prompt character changes to the Accent Color (Green).

### 6.3. Message Bubbles
- **Style**: There are NO bubbles. Messages are raw text blocks.
- **Structure**:
  `[14:32:01] <USERNAME>`
  `Message content goes here, spanning the full width of the container up to a max-width for readability.`
- **Self vs. Others**: Do not use left/right alignment. All messages are left-aligned. Differentiate user's own messages by highlighting the `<USERNAME>` in the Accent Color.

## 7. Micro-interactions & Animations
- **Transitions**: Minimal to none. If an element changes state, it should do so instantly to mimic terminal responsiveness. `transition: none;`.
- **Typing Indicator**: A simple blinking block cursor `█` or a repeating dot sequence `.` `..` `...` in monospace.
- **New Message Arrival**: New messages snap into view instantly. Avoid smooth scrolling unless specifically requested by accessibility settings.

## 8. Accessibility Considerations
- **Contrast**: The pure black/white palette heavily exceeds WCAG AAA contrast requirements.
- **Focus Indicators**: Extremely visible focus rings using a 2px solid line of the Accent color.
- **Motion**: Reduced motion by default due to the lack of CSS transitions.

## 9. Conclusion
This brutalist theme strips away the excess of modern UI, resulting in a chat application that feels fast, dense, and highly focused. It leverages nostalgia while providing an extremely functional and legible tool for communication.
