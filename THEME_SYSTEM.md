# Theme System

SwiftSelect's toolbar and status bar support light and dark themes. The system is adaptive: it tries to match the page by default, but the user can override it.

<br>

## Page Luminance Detection

`theme.js` exports an `isPageDark()` function that samples the page's background colour. It reads `window.getComputedStyle(document.body).backgroundColor`, parses the RGB values, and computes relative luminance using the standard formula.

If the luminance is below a threshold, the page is considered dark.

<br>

## Theme Preference Storage

When the user clicks the theme toggle button in the toolbar, the new preference is saved to `chrome.storage.local` under a key tied to the page's origin. This means different sites can have different theme preferences.

<br>

## Theme Resolution

`shouldUseDarkMode()` resolves the active theme using this priority:

1. If the user has explicitly set a preference for this origin → use it
2. Otherwise → match the page luminance

<br>

## Application

`applyTheme()` toggles a `qs-theme-dark` class on the toolbar, status bar, and HUD elements. All colour changes are handled by CSS custom properties scoped under that class in `styles.css`.

The theme is reapplied whenever the toolbar is shown and whenever the status bar appears, ensuring consistency even if the page's background changes between activations.