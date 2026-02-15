/**
 * Utility functions for capture operations
 */

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function getSmartFilename(type, ext = "png") {
  let title = document.title || "";
  title = title.replace(/[<>:"\/\\|?*\x00-\x1F]/g, " ");
  title = title.trim().replace(/\s+/g, " ");
  if (title.length > 100) title = title.substring(0, 100).trim();

  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return title
    ? `${title} - ${type} - ${timestamp}.${ext}`
    : `${type} - ${timestamp}.${ext}`;
}

let _cursorStyleTag = null;

export function toggleCursor(hide) {
  if (hide) {
    if (!_cursorStyleTag) {
      _cursorStyleTag = document.createElement("style");
      _cursorStyleTag.id = "qs-cursor-hide";
      _cursorStyleTag.textContent = `
        * { cursor: none !important; }
        .qs-ovl, .qs-guide, .qs-status-host { cursor: none !important; }
      `;
      (document.head || document.documentElement).appendChild(_cursorStyleTag);
    }
  } else {
    if (_cursorStyleTag) {
      _cursorStyleTag.remove();
      _cursorStyleTag = null;
    }
  }
}
