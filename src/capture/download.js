import { getSmartFilename } from "./utils.js";

let lastBlob = null;

export function setLastBlob(blob) {
  lastBlob = blob;
}

export function getLastBlob() {
  return lastBlob;
}

export function handleSaveAction() {
  if (!lastBlob) return;

  const url = URL.createObjectURL(lastBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = getSmartFilename("screenshot");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Transition Logic via UI
  const statusEl = window.SwiftSelect.ui.statusEl;
  if (statusEl) {
    const textSpan = statusEl.querySelector("span");
    const saveBtn = statusEl.querySelector(".qs-save-btn");

    if (textSpan && saveBtn) {
      textSpan.style.transition =
        "transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.14s ease";
      saveBtn.style.transition =
        "transform 0.16s cubic-bezier(0.2, 0, 0, 1), opacity 0.12s ease";
      statusEl.style.transition =
        "transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)";

      statusEl.style.transform = "translate3d(-50%, -2px, 0) scale(1.015)";
      saveBtn.style.opacity = "0";
      saveBtn.style.transform = "scale(0.9) translateX(6px)";

      setTimeout(() => {
        textSpan.style.transform = "translateY(2px)";
        textSpan.style.opacity = "0.35";

        setTimeout(() => {
          textSpan.textContent = "Image Saved";
          statusEl.classList.remove("qs-success");
          statusEl.classList.add("qs-saved");
          saveBtn.remove();

          textSpan.style.transform = "translateY(-1px)";
          textSpan.style.opacity = "1";

          setTimeout(() => {
            textSpan.style.transform = "translateY(0)";
            statusEl.style.transform = "translate3d(-50%, 0, 0) scale(1)";
          }, 100);
        }, 150);
      }, 100);
    }

    if (window.SwiftSelect.ui.hideStatusTimer)
      clearTimeout(window.SwiftSelect.ui.hideStatusTimer);

    window.SwiftSelect.ui.setHideStatusTimer(
      setTimeout(() => {
        if (statusEl) {
          statusEl.classList.add("qs-hiding");
          setTimeout(() => {
            statusEl.style.display = "none";
            window.SwiftSelect.ui.statusHost.style.display = "none";
            statusEl.classList.remove("qs-hiding");
            window.SwiftSelect.ui.setCurrentStatus(null);
          }, 300);
        }
      }, 2500),
    );
  }
}
