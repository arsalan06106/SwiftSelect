// contentScript.js - Restored UI with Material 3 Expressive Motion
(() => {
  if (window.__qsInjected) return;
  window.__qsInjected = true;

  const SHADOW_CSS = `
    .qs-ovl {
      all: initial;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: rgba(0, 0, 0, 0.02);
      cursor: crosshair !important;
      user-select: none;
      pointer-events: auto;
    }
    .qs-ovl * {
      cursor: crosshair !important;
    }
    .qs-box {
      all: initial;
      position: absolute;
      border: 2px solid #ff6a61;
      border-radius: 12px;
      background: rgba(255, 106, 97, 0.12);
      pointer-events: none;
      box-sizing: border-box;
    }
    .qs-guide {
      all: initial;
      color: #1C1B1F;
      font-family: 'Google Sans', 'Roboto', system-ui, sans-serif;
      font-weight: 500;
      font-size: 26px;
      background: #ffebe9; /* Original Background */
      border: none;
      border-radius: 999px; /* Original Shape */
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
      pointer-events: auto;
      z-index: 2147483648;
      display: flex;
      align-items: center;
      flex-direction: row;
      gap: 12px;
      top: 24px;
      right: 24px;
      padding: 12px;
      position: fixed;
      min-width: auto;
      max-width: 500px;
      
      /* Expressive Motion - Entrance */
      transform-origin: top center;
      animation: expressiveExpand 500ms cubic-bezier(0.2, 0.0, 0.0, 1.0) forwards;
      opacity: 0; /* Star invisible */
    }

    /* Expressive Motion - Exit */
    .qs-guide.qs-hiding {
      animation: expressiveCollapse 300ms cubic-bezier(0.3, 0.0, 0.8, 0.15) forwards !important;
    }

    .qs-guide-header {
      display: none;
    }
    .qs-guide-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }
     /* Global Button Styles */
    .qs-guide-btn {
      text-align: center;
      all: initial;
      cursor: pointer;
      background: #ff6a61;
      color: #ffffff;
      padding: 0 20px;
      border-radius: 999px;
      font-size: 16px;
      font-family: 'Google Sans', 'Roboto', system-ui, sans-serif;
      font-weight: 500;
      border: none;
      outline: none;
      transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      width: auto;
      min-width: 56px;
      height: 56px;
      position: relative;
      gap: 8px;
    }
    .qs-guide-btn svg {
      width: 28px;
      height: 28px;
      fill: currentColor;
      transition: all 0.3s ease;
    }
    .qs-guide-btn:hover {
      box-shadow: inset 0 0 0 100px rgba(255, 255, 255, 0.2);
    }
    .qs-guide-btn:active {
      transform: scale(0.96);
    }
    /* Segmented Button Group */
    .qs-segmented {
      display: flex;
      background: #ff6a61;
      border-radius: 999px;
      padding: 4px;
      gap: 4px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
      height: auto;
      align-items: center;
    }
    .qs-segmented:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .qs-segmented .qs-guide-btn {
      background: transparent;
      box-shadow: none !important;
      height: 48px;
      transform: none !important;
      border-radius: 999px;
    }
    /* Visible Area Button (Left) */
    .qs-segmented .qs-guide-btn:first-child {
      border-radius: 999px;
      padding: 0 16px;
      width: auto;
    }
    /* Download Button (Right) - Pure Circle */
    .qs-segmented .qs-guide-btn:last-child {
      border-radius: 50%;
      background: #ffffff;
      color: #ff6a61;
      width: 48px;
      height: 48px;
      padding: 0;
      min-width: 48px;
    }
    .qs-segmented .qs-guide-btn:last-child svg {
      width: 24px;
      height: 24px;
    }
    .qs-segmented .qs-guide-btn:hover {
      box-shadow: inset 0 0 0 100px rgba(255, 255, 255, 0.2) !important;
      transform: none !important;
    }
    /* Specific hover for white download button (dark overlay) */
    .qs-segmented .qs-guide-btn:last-child:hover {
      box-shadow: inset 0 0 0 100px rgba(0, 0, 0, 0.05) !important;
    }
    .qs-separator {
      display: none;
    }
    /* Standalone Full Page Button */
    .qs-guide-buttons > .qs-guide-btn {
      border-radius: 999px !important;
      padding: 0 20px;
    }
    /* Tooltip */
    .qs-guide-btn::before {
      content: attr(data-tooltip);
      position: absolute;
      bottom: -34px;
      left: 50%;
      transform: translateX(-50%) scale(0.8);
      background: rgba(28, 27, 31, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s ease;
      font-family: 'Google Sans', system-ui, sans-serif;
      z-index: 2147483649;
    }
    .qs-guide-btn:hover::before {
      opacity: 1;
      transform: translateX(-50%) scale(1);
      bottom: -40px;
    }
    .qs-guide-btn.qs-loading {
      pointer-events: none;
      opacity: 0.6;
    }
    .qs-guide-btn.qs-loading svg {
      opacity: 0;
    }
    .qs-guide-btn.qs-loading::after {
      content: "";
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    /* ... status styles ... */
    .qs-status {
      left: 50%;
      bottom: 40px;
      transform: translate(-50%, 0);
      padding: 12px 24px;
      position: fixed;
      color: #1C1B1F;
      font-family: 'Google Sans', system-ui, sans-serif;
      font-weight: 500;
      font-size: 16px;
      background: #ffebe9;
      border: none;
      border-radius: 999px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      pointer-events: none;
      z-index: 2147483648;
      display: flex;
      align-items: center;
      gap: 16px;
      max-width: 90vw;
      min-height: 56px;
      
      /* Expressive Entrance for Toast */
      opacity: 0;
      animation: expressiveSlideUp 500ms cubic-bezier(0.2, 0.0, 0.0, 1.0) forwards;
    }

    .qs-status.qs-hiding {
      animation: expressiveSlideDown 300ms cubic-bezier(0.3, 0.0, 0.8, 0.15) forwards !important;
    }

    .qs-status.no-anim {
      animation: none !important;
      transition: none !important;
      opacity: 1 !important;
      transform: translate(-50%, 0) !important;
    }

    .qs-status.qs-success {
      pointer-events: auto;
      background: #D1E7DD;
      color: #0A3622;
    }
    .qs-status.qs-success .qs-save-btn {
      cursor: pointer;
      background: #ff6a61;
      color: white;
      padding: 0;
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      font-size: 0;
      border: none;
      outline: none;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qs-status.qs-success .qs-save-btn svg {
      width: 24px;
      height: 24px;
      fill: white;
    }
    .qs-status.qs-success .qs-save-btn:hover {
      background: #e85a52;
      transform: translateY(-1px);
    }
    .qs-status.qs-error {
      background: #F8D7DA;
      color: #721C24;
    }
    .qs-status.qs-saved {
      background: #D1E7DD;
      color: #0A3622;
    }
    .qs-status-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ff6a61;
      color: white;
      font-size: 16px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .qs-status.qs-success .qs-status-icon {
      background: #198754;
    }
    .qs-status.qs-success .qs-status-icon::after {
      content: "✓";
      font-size: 16px;
    }
    .qs-status.qs-error .qs-status-icon {
      background: #DC3545;
    }
    .qs-status.qs-error .qs-status-icon::after {
      content: "!";
      font-size: 16px;
    }
    .qs-status.qs-saved .qs-status-icon {
      background: #198754;
    }
    .qs-status.qs-saved .qs-status-icon::after {
      content: "✓";
      font-size: 16px;
    }
    .qs-status-icon::after {
      content: "i";
      font-size: 12px;
    }
    
    /* NEW EXPRESSIVE KEYFRAMES */
    
    /* Expand from a slightly smaller scale + subtle Y offset */
    @keyframes expressiveExpand {
      0% { 
        transform: translateY(-20px) scale(0.8);
        opacity: 0;
      }
      100% { 
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    /* Collapse simply and quickly */
    @keyframes expressiveCollapse {
      0% { 
        transform: translateY(0) scale(1);
        opacity: 1;
      }
      100% { 
        transform: translateY(-10px) scale(0.9);
        opacity: 0;
      }
    }

    /* Slide Up for Toast - Crisp */
    @keyframes expressiveSlideUp {
      0% { 
        transform: translate(-50%, 20px) scale(0.95);
        opacity: 0;
      }
      100% { 
        transform: translate(-50%, 0) scale(1);
        opacity: 1;
      }
    }

    /* Slide Down Exit */
    @keyframes expressiveSlideDown {
      0% { 
        transform: translate(-50%, 0) scale(1);
        opacity: 1;
      }
      100% { 
        transform: translate(-50%, 15px) scale(0.95);
        opacity: 0;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive Scaling for Zoom/Small Screens */
    @media (max-width: 900px) {
      .qs-guide { padding: 8px; }
      .qs-guide-btn { height: 48px; min-width: 48px; font-size: 14px; padding: 0 16px; }
      .qs-guide-btn svg { width: 24px; height: 24px; }
      .qs-segmented .qs-guide-btn { height: 40px; }
      .qs-segmented .qs-guide-btn:last-child { width: 40px; height: 40px; min-width: 40px; }
      .qs-segmented .qs-guide-btn:last-child svg { width: 20px; height: 20px; }
      
      .qs-status { padding: 10px 20px; min-height: 48px; font-size: 14px; bottom: 32px; }
      .qs-status-icon { width: 24px; height: 24px; font-size: 14px; }
      .qs-status.qs-success .qs-save-btn { width: 36px; height: 36px; min-width: 36px; }
      .qs-status.qs-success .qs-save-btn svg { width: 20px; height: 20px; }
    }

    @media (max-width: 600px) {
      .qs-guide { padding: 6px; }
      .qs-guide-btn { height: 40px; min-width: 40px; font-size: 13px; padding: 0 12px; }
      .qs-guide-btn svg { width: 20px; height: 20px; }
      .qs-segmented .qs-guide-btn { height: 32px; }
      .qs-segmented .qs-guide-btn:last-child { width: 32px; height: 32px; min-width: 32px; }
      .qs-segmented .qs-guide-btn:last-child svg { width: 16px; height: 16px; }

      .qs-status { padding: 8px 16px; min-height: 40px; font-size: 13px; bottom: 24px; }
      .qs-status-icon { width: 20px; height: 20px; font-size: 12px; }
      .qs-status.qs-success .qs-save-btn { width: 32px; height: 32px; min-width: 32px; }
      .qs-status.qs-success .qs-save-btn svg { width: 16px; height: 16px; }
    }
  `;

  function makeShadowOverlay(tag, className, innerHTML = "") {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.zIndex = "2147483647";
    host.style.pointerEvents = "none";
    host.style.inset = "0";
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });
    const el = document.createElement(tag);
    el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    shadow.appendChild(el);

    const style = document.createElement("style");
    style.textContent = SHADOW_CSS;
    shadow.appendChild(style);

    return { host, el, shadow };
  }

  let overlayHost, boxHost, statusHost, guideHost;
  let overlay, box, statusEl, guideEl, guideShadow;
  let dragging = false;
  let startX = 0, startY = 0;
  let rect = { left: 0, top: 0, width: 0, height: 0 };
  let lastBlob = null;

  function setCrosshairCursor() {
    document.body.style.cursor = "crosshair";
    document.documentElement.style.cursor = "crosshair";
  }

  function removeCrosshairCursor() {
    document.body.style.cursor = "";
    document.documentElement.style.cursor = "";
  }

  function ensureUi() {
    setCrosshairCursor();
    
    if (!overlayHost) {
      const { host, el } = makeShadowOverlay("div", "qs-ovl");
      overlayHost = host;
      overlay = el;
      overlayHost.style.pointerEvents = "auto";
    }
    if (!statusHost) {
      const { host, el } = makeShadowOverlay("div", "qs-status");
      statusHost = host;
      statusEl = el;
      statusHost.style.display = "none";
    }

    if (!guideHost) {
      const { host, el, shadow } = makeShadowOverlay("div", "qs-guide");
      guideHost = host;
      guideEl = el;
      guideShadow = shadow;
      
      guideEl.innerHTML = `
        <div class="qs-guide-buttons">
          <div class="qs-segmented">
            <button class="qs-guide-btn" data-action="capture-visible" data-tooltip="Copy visible area">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              <span>Visible Area</span>
            </button>
            <button class="qs-guide-btn" data-action="capture-download" data-tooltip="Download screenshot">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            </button>
          </div>
          <button class="qs-guide-btn" data-action="capture-full" data-tooltip="Capture full page">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M67-743.87V-933h189.13v73H140v116.13H67Zm753 0V-860H703.87v-73H893v189.13h-73ZM67-27v-189.13h73V-100h116.13v73H67Zm636.87 0v-73H820v-116.13h73V-27H703.87ZM273-233h414v-494H273v494Zm0 79.22q-31.38 0-55.3-23.92-23.92-23.92-23.92-55.3v-494q0-31.38 23.92-55.3 23.92-23.92 55.3-23.92h414q31.38 0 55.3 23.92 23.92 23.92 23.92 55.3v494q0 31.38-23.92 55.3-23.92 23.92-55.3 23.92H273Zm94.74-413.96h225.09v-65.09H367.74v65.09Zm0 120h225.09v-65.09H367.74v65.09Zm0 120h225.09v-65.09H367.74v65.09ZM273-233v-494 494Z"/></svg>
            <span>Full Page</span>
          </button>
        </div>
      `;
      
      // Add listeners
      const visibleBtn = guideShadow.querySelector('[data-action="capture-visible"]');
      visibleBtn.onclick = handleCaptureVisible;
      
      const downloadBtn = guideShadow.querySelector('[data-action="capture-download"]');
      downloadBtn.onclick = handleCaptureAndDownload;
      
      const fullBtn = guideShadow.querySelector('[data-action="capture-full"]');
      fullBtn.onclick = handleCaptureFullPage;
    }
    
    // Ensure guide is visible AND RESET ANIMATION CLASS
    if (guideHost) {
      guideHost.style.display = "flex";
      guideEl.classList.remove("qs-hiding");
      // Force Reflow to restart enter animation if needed
      void guideEl.offsetWidth;
    }
  }

  // ... cleanup ...

  let hideStatusTimer;
  let currentStatus = null;

  function setStatus(msg, timeout = 1500, type = "info", noAnim = false) {
    if (!msg || !msg.trim()) return;
    
    if (!statusHost || !statusEl) {
      const { host, el } = makeShadowOverlay("div", "qs-status");
      statusHost = host;
      statusEl = el;
    }

    if (hideStatusTimer) clearTimeout(hideStatusTimer);

    // Reset classes
    statusEl.className = "qs-status";
    statusEl.classList.remove("qs-hiding");
    if (noAnim) statusEl.classList.add("no-anim");
    
    statusEl.innerHTML = "";
    const iconEl = document.createElement("div");
    iconEl.className = "qs-status-icon";
    statusEl.appendChild(iconEl);

    const textSpan = document.createElement("span");
    textSpan.textContent = msg;
    statusEl.appendChild(textSpan);

    if (type === "success") {
      statusEl.classList.add("qs-success");
      const saveBtn = document.createElement("button");
      saveBtn.className = "qs-save-btn";
      saveBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>';
      saveBtn.onclick = () => handleSaveAction();
      statusEl.appendChild(saveBtn);
      timeout = 5000; // Increased timeout for success
    } else if (type === "saved") {
      statusEl.classList.add("qs-saved");
      timeout = 2500; // Reduced timeout for saved
    } else if (type === "error") {
      statusEl.classList.add("qs-error");
      timeout = 2500;
    }

    statusHost.style.display = "";
    statusEl.style.display = "flex";
    
    currentStatus = type;

    if (timeout > 0) {
      hideStatusTimer = setTimeout(() => {
        // Trigger Exit Animation
        statusEl.classList.add("qs-hiding");
        setTimeout(() => {
          if (statusEl.classList.contains("qs-hiding")) {
             statusEl.style.display = "none";
             statusHost.style.display = "none";
             statusEl.classList.remove("qs-hiding");
             currentStatus = null;
          }
        }, 300); // 300ms matches animation duration
      }, timeout);
    }
  }


  function cleanup() {
    removeCrosshairCursor();
    dragging = false;
    if (boxHost && boxHost.parentNode) boxHost.parentNode.removeChild(boxHost);
    boxHost = null; box = null;
    if (overlayHost && overlayHost.parentNode) overlayHost.parentNode.removeChild(overlayHost);
    overlayHost = null; overlay = null;
    
    // Animate guide out
    if (guideEl && guideHost) {
        guideEl.classList.add("qs-hiding");
        setTimeout(() => {
            if (guideHost && guideHost.parentNode) guideHost.parentNode.removeChild(guideHost);
            guideHost = null; guideEl = null; guideShadow = null;
        }, 300);
    } else {
        if (guideHost && guideHost.parentNode) guideHost.parentNode.removeChild(guideHost);
        guideHost = null; guideEl = null; guideShadow = null;
    }
    
    removeListeners();
  }

  function handleSaveAction() {
    if (!lastBlob) return;

    // Save the file first
    const url = URL.createObjectURL(lastBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `screenshot-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Satisfying smooth morph transition
    const textSpan = statusEl.querySelector("span");
    const saveBtn = statusEl.querySelector(".qs-save-btn");
    
    if (textSpan && saveBtn) {
      // Add smooth transitions with bounce
      textSpan.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
      saveBtn.style.transition = "all 0.3s ease-out";
      statusEl.style.transition = "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";
      
      // Stage 1: Slight scale up and button fade
      statusEl.style.transform = "translate(-50%, -3px) scale(1.05)";
      saveBtn.style.opacity = "0";
      saveBtn.style.transform = "scale(0.7) translateX(10px)";
      
      setTimeout(() => {
        // Stage 2: Text morphs with scale
        textSpan.style.transform = "scale(0.9)";
        textSpan.style.opacity = "0.3";
        
        setTimeout(() => {
          // Stage 3: Change content and morph back
          textSpan.textContent = "Image saved successfully";
          statusEl.classList.remove("qs-success");
          statusEl.classList.add("qs-saved");
          saveBtn.remove();
          
          textSpan.style.transform = "scale(1.1)";
          textSpan.style.opacity = "1";
          
          setTimeout(() => {
            // Stage 4: Settle to final state with bounce
            textSpan.style.transform = "scale(1)";
            statusEl.style.transform = "translate(-50%, 0) scale(1)";
          }, 100);
        }, 150);
      }, 100);
    }

    // Clear existing timer and set new one
    if (hideStatusTimer) clearTimeout(hideStatusTimer);
    hideStatusTimer = setTimeout(() => {
      if (statusEl) {
        statusEl.classList.add("qs-hiding");
        setTimeout(() => {
          statusEl.style.display = "none";
          statusHost.style.display = "none";
          statusEl.classList.remove("qs-hiding");
          currentStatus = null;
        }, 300);
      }
    }, 2500);
  }

  function setButtonLoading(action, loading) {
    if (!guideShadow) return;
    const btn = guideShadow.querySelector(`[data-action="${action}"]`);
    if (btn) {
      if (loading) {
        btn.classList.add("qs-loading");
        btn.disabled = true;
      } else {
        btn.classList.remove("qs-loading");
        btn.disabled = false;
      }
    }
  }

  async function handleCaptureVisible() {
    try {
      setButtonLoading("capture-visible", true);
      await hideUiForCapture();
      cleanup();

      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
      });
      if (!resp?.success) throw new Error(resp?.error || "Capture failed");

      const img = await loadImage(resp.dataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      lastBlob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
      );

      await navigator.clipboard.write([new ClipboardItem({ "image/png": lastBlob })]);
      setStatus("Visible area copied to clipboard", 5000, "success");
    } catch (err) {
      console.error("handleCaptureVisible error:", err);
      setStatus("Capture failed", 3000, "error");
    } finally {
      setButtonLoading("capture-visible", false);
    }
  }

  async function handleCaptureAndDownload() {
    try {
      setButtonLoading("capture-download", true);
      await hideUiForCapture();
      cleanup();

      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
      });
      if (!resp?.success) throw new Error(resp?.error || "Capture failed");

      const img = await loadImage(resp.dataUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      lastBlob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
      );

      // Copy to clipboard
      await navigator.clipboard.write([new ClipboardItem({ "image/png": lastBlob })]);
      
      // Also download the image
      const url = URL.createObjectURL(lastBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus("Copied to clipboard and downloaded", 5000, "saved");
    } catch (err) {
      console.error("handleCaptureAndDownload error:", err);
      setStatus("Capture failed", 3000, "error");
    } finally {
      setButtonLoading("capture-download", false);
    }
  }


  async function hideUiForCapture() {
    if (overlayHost) overlayHost.style.display = "none";
    if (boxHost) boxHost.style.display = "none";
    if (guideHost) guideHost.style.display = "none";
    if (statusHost) statusHost.style.display = "none";
    await nextPaint();
    await new Promise(r => setTimeout(r, 50));
  }



  async function handleCaptureFullPage() {
    try {
      ensureUi(); // Ensure UI exists
      removeCrosshairCursor(); // Remove drag cursor during capture
      removeListeners(); // Disable drag selection listeners
      dragging = false; // Explicitly disable dragging
      
      updateBadge("0%");
      
      const btn = guideShadow?.querySelector('[data-action="capture-full"]');
      const originalIcon = btn?.innerHTML;
      
      // 1. Start Loading
      if (btn) {
        btn.classList.add("qs-loading");
        // Create progress text element
        let progressSpan = document.createElement("span");
        progressSpan.className = "qs-progress-text";
        progressSpan.textContent = "0%";
        btn.appendChild(progressSpan);
      }
      
      // Hide fixed elements ONLY (leave sticky as they affect layout flow)
      const fixedElements = [];
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed') {
          fixedElements.push({ el, originalVisibility: el.style.visibility });
          el.style.visibility = 'hidden';
        }
      }
      
      // 2. Prepare
      const dpr = window.devicePixelRatio || 1;
      const scrollWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
      const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;
      
      const canvas = document.createElement("canvas");
      canvas.width = scrollWidth * dpr;
      canvas.height = scrollHeight * dpr;
      const ctx = canvas.getContext("2d");
      
      const originalX = window.scrollX;
      const originalY = window.scrollY;
      
      let y = 0;
      let rows = Math.ceil(scrollHeight / viewportHeight);
      let currentRow = 0;

      // Hide UI ONCE before loop
      if (guideHost) guideHost.style.display = "none";
      await new Promise(r => requestAnimationFrame(r)); // Ensure paint

      while (y < scrollHeight) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 800)); // Increased wait for render/lazy-load
        
        // Update progress
        const pct = Math.min(100, Math.round((currentRow / rows) * 100));
        updateBadge(pct + "%");
        
        if (btn) {
          const span = btn.querySelector(".qs-progress-text");
          if (span) span.textContent = pct + "%";
        }
        
        // Capture visible tab
        const resp = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
        });
        
        if (resp && resp.success) {
          const img = await loadImage(resp.dataUrl);
          
          // Calculate where to draw based on ACTUAL scroll position
          const actualScrollY = window.scrollY;
          const drawY = actualScrollY * dpr;
          
          ctx.drawImage(img, 0, 0, img.width, img.height, 0, drawY, img.width, img.height);
        }
        
        y += viewportHeight;
        currentRow++;
      }
      
      // Restore scroll
      window.scrollTo(originalX, originalY);
      
      // Restore fixed elements
      for (const { el, originalVisibility } of fixedElements) {
        el.style.visibility = originalVisibility;
      }
      
      updateBadge("100%");
      
      // 3. Success State
      if (btn) {
        btn.classList.remove("qs-loading");
        // Remove progress span
        const span = btn.querySelector(".qs-progress-text");
        if (span) span.remove();
        btn.classList.add("qs-success");
        // Swap icon to checkmark
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg><span>Full Page</span>';
      }
      
      // Show UI back
      // if (guideHost) guideHost.style.display = "flex"; // Don't show menu after capture

      lastBlob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
      );
      
      // Download
      const url = URL.createObjectURL(lastBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fullpage-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      updateBadge("✓", "#198754");
      setTimeout(() => updateBadge(""), 3000);
      
      cleanup(); // Close the menu immediately
      
    } catch (err) {
      console.error("Full page capture error:", err);
      updateBadge("ERR", "#DC3545");
      setTimeout(() => updateBadge(""), 3000);
      
      const btn = guideShadow?.querySelector('[data-action="capture-full"]');
      if (btn) {
        btn.classList.remove("qs-loading");
        btn.classList.remove("qs-success");
        // Clean up progress span if it exists
        const span = btn.querySelector(".qs-progress-text");
        if (span) span.remove();
        
        if (originalIcon) btn.innerHTML = originalIcon;
      }
      setStatus("Capture failed", 3000, "error");
      if (guideHost) guideHost.style.display = "flex"; // Ensure visible on error
    }
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;
    
    const path = e.composedPath();
    // Check if the click is on the guide host or any of its children
    const isOnGuide = path.some(el => el === guideHost || (el.classList && el.classList.contains('qs-guide-btn')));
    
    if (isOnGuide) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    rect.left = startX;
    rect.top = startY;
    rect.width = 0;
    rect.height = 0;

    if (!boxHost) {
      const { host, el } = makeShadowOverlay("div", "qs-box");
      boxHost = host;
      box = el;
    }
    updateBox();
  }

  function onMouseMove(e) {
    if (!dragging) return;
    const x = e.clientX;
    const y = e.clientY;
    const left = Math.min(startX, x);
    const top = Math.min(startY, y);
    const width = Math.abs(x - startX);
    const height = Math.abs(y - startY);
    rect.left = left;
    rect.top = top;
    rect.width = width;
    rect.height = height;
    updateBox();
  }

  function onMouseUp(e) {
    if (!dragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    dragging = false;
    updateBox();

    // If click (no drag), cancel selection
    if (rect.width < 5 || rect.height < 5) {
      setStatus("Selection canceled", 1500);
      cleanup();
      return;
    }

    captureAndCrop(rect).finally(() => {
      cleanup();
      setStatus("Selection copied to clipboard", 5000, "success");
    });
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      setStatus("Canceled", 900);
      cleanup();
    }
  }

  function updateBox() {
    if (!box) return;
    box.style.left = rect.left + "px";
    box.style.top = rect.top + "px";
    box.style.width = rect.width + "px";
    box.style.height = rect.height + "px";
  }

  async function captureAndCrop(viewRect) {
    try {
      await hideUiForCapture();

      const resp = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
      });
      if (!resp?.success) throw new Error(resp?.error || "Capture failed");

      const img = await loadImage(resp.dataUrl);
      const dpr = window.devicePixelRatio || 1;
      const sx = Math.round(viewRect.left * dpr);
      const sy = Math.round(viewRect.top * dpr);
      const sw = Math.round(viewRect.width * dpr);
      const sh = Math.round(viewRect.height * dpr);

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      lastBlob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png")
      );

      await navigator.clipboard.write([new ClipboardItem({ "image/png": lastBlob })]);
    } catch (err) {
      console.error("captureAndCrop error:", err);
      setStatus("Capture failed", 3000, "error");
      throw err;
    }
  }

  function addListeners() {
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);
    document.addEventListener("keydown", onKeyDown, true);
  }

  function stopProp(e) {
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function preventAll(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function addListeners() {
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("mouseup", onMouseUp, true);
    document.addEventListener("keydown", onKeyDown, true);
    
    // Block other events from reaching the page
    document.addEventListener("pointerdown", stopProp, true);
    document.addEventListener("pointerup", stopProp, true);
    document.addEventListener("click", preventAll, true);
    document.addEventListener("dblclick", preventAll, true);
    document.addEventListener("contextmenu", preventAll, true);
  }

  function removeListeners() {
    document.removeEventListener("mousedown", onMouseDown, true);
    document.removeEventListener("mousemove", onMouseMove, true);
    document.removeEventListener("mouseup", onMouseUp, true);
    document.removeEventListener("keydown", onKeyDown, true);
    
    document.removeEventListener("pointerdown", stopProp, true);
    document.removeEventListener("pointerup", stopProp, true);
    document.removeEventListener("click", preventAll, true);
    document.removeEventListener("dblclick", preventAll, true);
    document.removeEventListener("contextmenu", preventAll, true);
  }

  function nextPaint() {
    return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function startSelection() {
    ensureUi();
    addListeners();
  }

  startSelection();
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "start-selection") {
      startSelection();
      sendResponse({ success: true });
    } else if (request.type === "capture-visible") {
      handleCaptureVisible();
      sendResponse({ success: true });
    } else if (request.type === "capture-download") {
      handleCaptureAndDownload();
      sendResponse({ success: true });
    } else if (request.type === "capture-full") {
      handleCaptureFullPage();
      sendResponse({ success: true });
    }
  });

  // Helper to update badge
  function updateBadge(text, color = "#ff6a61") {
    chrome.runtime.sendMessage({ type: "update-badge", text, color });
  }

  // Initialize
})();