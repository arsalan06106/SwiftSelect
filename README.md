<div align="center">

<br>

<img src="icons/icon128.png" alt="SwiftSelect" width="96">

<br><br>

# SwiftSelect

**Capture · Copy · Download — in one motion.**

The fastest screenshot tool for Chrome. Select a region, grab the viewport, or scroll-capture an entire page.
<br>Everything lands on your clipboard automatically.

<br>

[![Chrome](https://raw.githubusercontent.com/creosB/creosB/refs/heads/main/assets/Chrome%20Web%20Store.svg)](https://chromewebstore.google.com/detail/swiftselect-capture-copy/aboceojignbeaclebdpjjgkocmdldoec)

</div>

<br>

---

<br>

## Why SwiftSelect

Most screenshot extensions are slow, cluttered, or want you to sign up for something. SwiftSelect does exactly three things and does them instantly:

| Mode              | What happens                                     | Output                                  |
| :---------------- | :----------------------------------------------- | :-------------------------------------- |
| **Region Select** | Draw a box around anything on the page           | Copied to clipboard                     |
| **Visible Area**  | Captures the current viewport in one click       | Copied to clipboard + optional download |
| **Full Page**     | Scrolls the entire page and stitches it together | Saved as a file                         |

Full-page capture works on complex SPAs — Notion, Slack, Gemini, you name it.

<br>

## Keyboard Shortcuts

Every action has a shortcut. No toolbar hunting required.

| Shortcut                      | Action                                            |
| :---------------------------- | :------------------------------------------------ |
| <kbd>Alt</kbd> + <kbd>X</kbd> | Activate SwiftSelect (opens the floating toolbar) |
| <kbd>Alt</kbd> + <kbd>S</kbd> | Capture visible area & download                   |
| <kbd>Alt</kbd> + <kbd>F</kbd> | Capture full page & download                      |
| <kbd>Esc</kbd>                | Cancel and close                                  |

Clicking the extension icon in the toolbar also activates region selection mode directly.

<br>

## Selection Modifiers

While dragging a region selection, hold a modifier key to change behavior:

| Hold                                   | Effect                                                          |
| :------------------------------------- | :-------------------------------------------------------------- |
| <kbd>Shift</kbd>                       | Constrain to a perfect square                                   |
| <kbd>Space</kbd>                       | Reposition the selection box mid-drag                           |
| <kbd>Ctrl</kbd> / <kbd>⌘</kbd> + hover | Auto-detect elements (images, cards, videos) — click to capture |

<br>

## Theming

The floating toolbar includes a light/dark toggle. Your preference persists across sessions via `chrome.storage`.

<br>

## Install

### ◈ Chrome Web Store (recommended)

<a href="https://chromewebstore.google.com/detail/swiftselect-capture-copy/aboceojignbeaclebdpjjgkocmdldoec">
  <img src="https://img.shields.io/badge/Install_SwiftSelect-Chrome_Web_Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install from Chrome Web Store">
</a>

### ◈ From Source

```bash
git clone https://github.com/arsalan06106/SwiftSelect-capture-copy-download-screenshots.git
```

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the cloned directory
4. Pin SwiftSelect from the extensions menu — done

<br>

<details>
<summary><strong>Project Structure</strong></summary>

<br>

```
SwiftSelect/
├── manifest.json            # Extension config (MV3)
├── background.js            # Service worker — command routing, offscreen doc management
├── contentScript.js         # Entry point injected into pages, loads src/ modules
├── popup.html               # Extension popup UI
├── popup.js                 # Popup button handlers
├── menu.html                # Context menu UI
├── menu.js                  # Menu theme toggle & button interactions
├── offscreen.html           # Offscreen document shell (MV3 clipboard/tabCapture)
├── offscreen.js             # Offscreen logic — full-page stitching & clipboard ops
├── styles.css               # All overlay, toolbar & selection styles
├── src/
│   ├── ui.js                # Toolbar & overlay rendering
│   ├── events.js            # Input & event handling (drag, modifiers, element detection)
│   ├── theme.js             # Light/dark theme logic
│   └── capture/
│       ├── region.js        # Region & visible-area capture engine
│       ├── fullpage.js      # Scroll-capture with sticky-element neutralisation
│       ├── download.js      # File-save & status-bar transition logic
│       └── utils.js         # Shared helpers (image loading, smart filenames, cursor toggle)
└── icons/                   # Extension icons (48px, 128px)
```

</details>

<details>
<summary><strong>Permissions & Why</strong></summary>

<br>

| Permission        | Reason                                                           |
| :---------------- | :--------------------------------------------------------------- |
| `activeTab`       | Access the current tab to capture content                        |
| `scripting`       | Inject the capture overlay into pages                            |
| `tabs`            | Query tab state for multi-step captures                          |
| `tabCapture`      | Capture visible tab content as an image                          |
| `clipboardWrite`  | Copy screenshots to clipboard automatically                      |
| `offscreen`       | Create an offscreen document for clipboard API (MV3 requirement) |
| `storage`         | Persist user preferences (theme, etc.)                           |
| `<all_urls>` ¹    | Operate on any webpage                                           |

¹ Declared under `host_permissions` in Manifest V3.

</details>

<br>

## Contributing

Found a bug or have a feature idea? [Open an issue](https://github.com/arsalan06106/SwiftSelect-capture-copy-download-screenshots/issues).
Pull requests are welcome.

<br>

## License

[MIT](LICENSE.txt) © 2026 [arsalan06106](https://github.com/arsalan06106)

<br>

---

<div align="center">

<br>

**Built by [@arsalan06106](https://github.com/arsalan06106)**

If SwiftSelect saves you time, consider leaving a ★ on the repo.

<br>

</div>
