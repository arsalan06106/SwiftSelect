# Element Detection (Smart Snap)

When the user holds <kbd>Ctrl</kbd> (or <kbd>⌘</kbd> on Mac) and moves the mouse, SwiftSelect highlights the most relevant element under the cursor. Clicking captures that element directly, without needing to draw a selection box.

This document explains how the detection algorithm works.

<br>

## How It Triggers

In `events.js`, the `onPointerMove` handler checks `e.ctrlKey || e.metaKey` on every mouse move. If neither is held, the highlighter is hidden and the function returns early.

A 100ms throttle prevents the detection logic from running on every pixel of mouse movement.

<br>

## Candidate Discovery

`document.elementsFromPoint(x, y)` returns all elements stacked at the cursor position, ordered from topmost to bottommost. The function iterates through them looking for the first significant candidate.

Extension UI elements (overlay, toolbar, status bar, highlighter) are excluded by checking against known Shadow DOM hosts.

<br>

## Significance Test

Not every element under the cursor deserves highlighting. The `isSignificant()` function applies these filters:

### Size

- Elements smaller than 50×50 pixels are rejected.
- Elements larger than 95% of the viewport (in either dimension) are rejected — unless they are media elements.

### Tag Exclusions

- `<body>` and `<html>` are always rejected.

### Automatic Accept

These elements are always considered significant if they pass the size check:

- Media: `IMG`, `VIDEO`, `SVG`, `CANVAS`, `IFRAME`, `EMBED`, `OBJECT`
- Interactive: `INPUT`, `TEXTAREA`, `SELECT`, `BUTTON`, `A`

### Visual Substance Check

For other elements, the algorithm checks computed styles:

- Has a background image?
- Has a non-transparent background colour?
- Has a visible border (non-zero width, non-none style, non-transparent colour)?
- Has a box shadow?

If none of these are true and the element is large (>300×300), it also checks whether the element contains at least 10 characters of text. Large, visually empty containers are rejected.

<br>

## Highlighting

When a significant candidate is found, the highlighter element (a semi-transparent overlay in its own Shadow DOM) is positioned and sized to match the candidate's bounding rect.

The HUD (dimension display) also updates to show the element's size.

<br>

## Capture on Click

If the user clicks while an element is highlighted (and the drawn selection is smaller than 5×5 pixels, meaning it was a click rather than a drag), `captureAndCrop()` is called with the highlighted element's bounding rect. The capture follows the same pipeline as a region capture — `captureVisibleTab` → crop to rect → clipboard.