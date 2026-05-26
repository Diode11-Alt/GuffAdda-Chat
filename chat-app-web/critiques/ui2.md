# Accessibility & Focus State Critique: GlassSidebar.tsx

After reviewing the `GlassSidebar.tsx` component, I have identified several critical issues regarding screen-reader compatibility and keyboard navigation.

## 1. Non-Semantic Interactive Elements
The navigation items and the "Log out" button are currently implemented as `<div>` elements with `onClick` handlers:
```tsx
<div
  key={item.id}
  className={`glass-nav-item ${activeId === item.id ? 'active' : ''}`}
  onClick={() => setActiveId(item.id)}
>
```
**Issues:**
- **No Keyboard Focus:** Since `<div>` elements do not receive keyboard focus by default, keyboard-only users cannot navigate to these items using the `Tab` key.
- **No Screen-Reader Role:** Screen readers will not announce these elements as interactive (like a button or link), so users will not know they can be activated.
- **No Keyboard Activation:** Pressing `Enter` or `Space` will not trigger the `onClick` handler.

**Recommendation:**
Change the `<div>` elements to `<button>` elements (or `<a>` if they handle routing). If you must use `<div>`, add `role="button"`, `tabIndex={0}`, and an `onKeyDown` handler to support `Enter` and `Space`.

## 2. Missing State Indications for Screen Readers
The component visually indicates the active navigation item using the `active` class, but this state is hidden from screen readers.

**Recommendation:**
Add `aria-current="page"` (if navigating routes) or `aria-selected="true"` to the currently active navigation item so screen readers announce it as the selected item.

## 3. Unclear Badge Announcements
The badge is rendered as a simple span:
```tsx
{item.badge && <span className="glass-badge">{item.badge}</span>}
```
A screen reader reading the "Messages" item will simply announce "Messages 3", which lacks context.

**Recommendation:**
Provide context using visually hidden text (e.g., a `.sr-only` class):
```tsx
{item.badge && (
  <span className="glass-badge">
    <span aria-hidden="true">{item.badge}</span>
    <span className="sr-only">{item.badge} unread messages</span>
  </span>
)}
```

## 4. Decorative SVGs Lack `aria-hidden`
The component includes several inline SVG icons (logo, navigation icons, logout icon). Currently, screen readers might attempt to read the raw SVG paths or announce them as unlabelled graphics.

**Recommendation:**
Add `aria-hidden="true"` to all decorative `<svg>` elements to hide them from assistive technologies, as the adjacent text labels already convey the meaning.

## 5. Landmark Navigation Missing Accessible Name
The sidebar uses the `<aside>` and `<nav>` landmark elements, which is good semantic HTML. However, if there are multiple `<nav>` elements on the page, they need to be distinguishable.

**Recommendation:**
Add an `aria-label="Sidebar"` to the `<nav>` or `<aside>` element.

## 6. Focus States
Because the interactive elements are un-focusable `<div>`s, the component inherently lacks focus states. Once these are converted to focusable elements (`<button>` or given `tabIndex={0}`), they must have a visible focus ring.

**Recommendation:**
Ensure `GlassSidebar.css` includes robust `:focus-visible` styles for `.glass-nav-item` so keyboard users can clearly see which item has focus. A high-contrast outline (e.g., `outline: 2px solid white; outline-offset: 2px;`) works well against glassmorphism backgrounds.
