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
      textSpan.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
      saveBtn.style.transition = "all 0.3s ease-out";
      statusEl.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";

      statusEl.style.transform = "translate(-50%, -3px) scale(1.05)";
      saveBtn.style.opacity = "0";
      saveBtn.style.transform = "scale(0.7) translateX(10px)";

      setTimeout(() => {
        textSpan.style.transform = "scale(0.9)";
        textSpan.style.opacity = "0.3";

        setTimeout(() => {
          textSpan.textContent = "Image Saved";
          statusEl.classList.remove("qs-success");
          statusEl.classList.add("qs-saved");
          saveBtn.remove();

          textSpan.style.transform = "scale(1.1)";
          textSpan.style.opacity = "1";

          setTimeout(() => {
            textSpan.style.transform = "scale(1)";
            statusEl.style.transform = "translate(-50%, 0) scale(1)";
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
