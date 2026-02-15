# Quick Reference

A compact cheat sheet for SwiftSelect's interface and shortcuts.

<br>

## Activation

| Action                          | Result                                  |
| :------------------------------ | :-------------------------------------- |
| Click extension icon            | Opens selection mode                    |
| <kbd>Alt</kbd> + <kbd>X</kbd>   | Opens selection mode                    |
| <kbd>Alt</kbd> + <kbd>S</kbd>   | Captures visible area & downloads       |
| <kbd>Alt</kbd> + <kbd>F</kbd>   | Captures full page & downloads          |
| <kbd>Esc</kbd>                  | Cancels and closes                      |

<br>

## Selection Modifiers

| Hold while dragging              | Effect                                       |
| :------------------------------- | :------------------------------------------- |
| <kbd>Shift</kbd>                 | Constrains to a perfect square               |
| <kbd>Space</kbd>                 | Repositions the selection box mid-drag        |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd>  | Auto-detects elements — click to capture      |

<br>

## Toolbar Buttons

From left to right when the toolbar appears:

| Button         | Action                              | Output                    |
| :------------- | :---------------------------------- | :------------------------ |
| Eye icon       | Capture visible area                | Copied to clipboard       |
| Download icon  | Capture visible area & download     | Clipboard + file download |
| Scroll icon    | Capture full page                   | File download             |
| Moon/Sun icon  | Toggle light/dark theme             | Preference saved           |

<br>

## Output Behaviour

| Capture Type   | Clipboard | File Download | Notes                                    |
| :------------- | :-------- | :------------ | :--------------------------------------- |
| Region select  | ✓         | On demand ¹   | Save button appears in status bar        |
| Visible area   | ✓         | Optional      | Via toolbar download button or Alt+S     |
| Full page      | —         | ✓             | Too large for clipboard in most cases    |

¹ After a region capture, the status bar shows a save button. Clicking it downloads the captured image.

<br>

## Limitations

- Cannot run on `chrome://`, `edge://`, `about:` pages, or the Chrome Web Store
- Full-page capture may produce artifacts on pages with complex CSS transforms or WebGL canvases
- Clipboard write can be blocked by page Content Security Policy; the extension falls back to download in that case