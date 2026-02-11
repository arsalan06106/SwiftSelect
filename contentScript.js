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
      /* V5: High Contrast Double Border */
      border: 2px solid #ffffff;
      box-shadow: 0 0 0 2px #1a1a1a;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.1);
      pointer-events: none;
      box-sizing: border-box;
    }
    .qs-guide {
      all: initial;
      color: #1C1B1F;
      font-family: 'Google Sans', 'Roboto', system-ui, sans-serif;
      font-weight: 500;
      font-size: 26px;
      /* Transparent Glass Background */
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 0, 0, 0.08); /* Light subtle border for container */
      border-radius: 999px; /* Original Shape */
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
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
      background: transparent;
      color: #1a1a1a;
      padding: 0 20px;
      border-radius: 999px;
      font-size: 16px;
      font-family: 'Google Sans', 'Roboto', system-ui, sans-serif;
      font-weight: 500;
      border: 1.5px solid #1a1a1a;
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
      transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    }
    .qs-guide-btn:hover {
      background: #1a1a1a;
      color: #ffffff;
      border-color: #1a1a1a;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }
    .qs-guide-btn:active {
      transform: scale(0.96);
    }
    /* Segmented Button Group */
    .qs-segmented {
      display: flex;
      background: transparent;
      border-radius: 999px;
      padding: 0;
      gap: 8px; /* Slight gap since they are separate outlines now */
      box-shadow: none;
      transition: none; /* No interaction needed */
      height: auto;
      align-items: center;
    }
    .qs-segmented:hover {
      box-shadow: none;
    }
    .qs-segmented .qs-guide-btn {
      background: transparent;
      box-shadow: none !important;
      height: 48px;
      transform: none !important;
      border-radius: 999px;
      /* Ensure border is present */
      border: 1.5px solid #1a1a1a;
    }
    /* Visible Area Button (Left) */
    .qs-segmented .qs-guide-btn:first-child {
      border-radius: 999px;
      padding: 0 16px;
      width: auto;
    }
    /* Download Button (Right) - Inverse Style */
    .qs-segmented .qs-guide-btn:last-child {
      border-radius: 50%;
      background: #1a1a1a;
      color: #ffffff;
      border: 1.5px solid #1a1a1a;
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
      background: #1a1a1a !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    }
    /* Specific hover for inverse download button */
    .qs-segmented .qs-guide-btn:last-child:hover {
      background: #ffffff !important;
      color: #1a1a1a !important;
      border-color: #1a1a1a !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    }
    .qs-separator {
      display: none;
    }
    /* Standalone Full Page Button */
    .qs-guide-buttons > .qs-guide-btn {
      border-radius: 999px !important;
      /* Ensure border */
      border: 1.5px solid #1a1a1a;
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
      /* Solid Background - Status */
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      /* Aurora Background - Status */
      /* background: 
        radial-gradient(circle at top left, rgba(255, 106, 97, 0.15), transparent 40%),
        radial-gradient(circle at bottom right, rgba(90, 139, 255, 0.15), transparent 40%),
        rgba(255, 255, 255, 0.92); */
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      /* border: none; REMOVED */
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
      /* Success: Monochrome */
      background: #ffffff;
      border: 1px solid #1a1a1a;
      color: #1a1a1a;
    }
    .qs-status.qs-success .qs-save-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      /* V4: Inverse Style */
      background: #1a1a1a;
      color: #ffffff;
      border: 1.5px solid #1a1a1a;
      cursor: pointer;
      margin-left: auto;
      transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
      padding: 0;
      min-width: 40px;
    }
    .qs-status.qs-success .qs-save-btn:hover {
      background: #ffffff;
      color: #1a1a1a;
      transform: scale(1.05);
      border-color: #1a1a1a;
    }
    .qs-status.qs-success .qs-save-btn svg {
      width: 22px;
      height: 22px;
      fill: currentColor;
    }

    .qs-status.qs-error {
      /* Error: Monochrome */
      background: #ffffff;
      border: 1px solid #1a1a1a;
      color: #1a1a1a;
    }
    .qs-status.qs-saved {
      /* Saved: Monochrome */
      background: #ffffff;
      border: 1px solid #1a1a1a;
      color: #1a1a1a;
    }
    /* Status Icons - V4 Strict Monochrome + V5 Larger Size */
    .qs-status-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Default neutral style */
      background: #1a1a1a;
      border: none;
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .qs-status.qs-success .qs-status-icon {
      background: #1a1a1a;
      color: #ffffff;
    }
    .qs-status.qs-error .qs-status-icon {
      background: #1a1a1a;
      color: #ffffff;
    }
    .qs-status.qs-saved .qs-status-icon {
      background: #1a1a1a;
      color: #ffffff;
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

    /* V6: High Class Animations */
    
    /* Eye Blink & Pupil Dilation */
    @keyframes eyeBlink {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(0.1); }
    }
    @keyframes eyeLook {
      0%, 100% { transform: translate(0, 0); }
      25% { transform: translate(-1px, 0); }
      75% { transform: translate(1px, 0); }
    }
    .qs-guide-btn:hover .eye-lid {
      animation: eyeBlink 0.4s ease-in-out;
      transform-origin: center;
    }
    .qs-guide-btn:hover .eye-pupil {
      animation: eyeLook 0.8s ease-in-out;
    }

    /* Download Arrow Bounce */
    @keyframes dlBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(3px); }
    }
    .qs-guide-btn:hover .dl-arrow,
    .qs-save-btn:hover .dl-arrow {
      animation: dlBounce 0.6s ease-in-out;
    }

    /* Full Page Individual Corner Animations (Scaled for 960px ViewBox) */
    @keyframes cornerMoveTL { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(40px, 40px); } }
    @keyframes cornerMoveTR { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-40px, 40px); } }
    @keyframes cornerMoveBR { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-40px, -40px); } }
    @keyframes cornerMoveBL { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(40px, -40px); } }

    /* Line Wipe Animation (Left to Right) */
    @keyframes lineWipe {
      0% { clip-path: inset(0 100% 0 0); opacity: 0; }
      20% { opacity: 1; }
      100% { clip-path: inset(0 0 0 0); opacity: 1; }
    }

    .qs-guide-btn:hover .fp-tl { animation: cornerMoveTL 0.5s ease-in-out; }
    .qs-guide-btn:hover .fp-tr { animation: cornerMoveTR 0.5s ease-in-out; }
    .qs-guide-btn:hover .fp-br { animation: cornerMoveBR 0.5s ease-in-out; }
    .qs-guide-btn:hover .fp-bl { animation: cornerMoveBL 0.5s ease-in-out; }
    
    .qs-guide-btn:hover .fp-lines {
      animation: lineWipe 0.6s cubic-bezier(0.2, 0, 0, 1);
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
  let startX = 0,
    startY = 0;
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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path class="eye-lid" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                <circle class="eye-pupil" cx="12" cy="12" r="3"/>
              </svg>
              <span>Visible Area</span>
            </button>
            <button class="qs-guide-btn" data-action="capture-download" data-tooltip="Download screenshot">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path class="dl-arrow" d="M19 9h-4V3H9v6H5l7 7 7-7z"/>
                <path class="dl-bar" d="M5 18v2h14v-2H5z"/>
              </svg>
            </button>
          </div>
          <button class="qs-guide-btn" data-action="capture-full" data-tooltip="Capture full page">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
              <!-- Split Corners (Original Material Icon) -->
              <path class="fp-corner fp-tl" d="M67-743.87V-933h189.13v73H140v116.13H67Z"/>
              <path class="fp-corner fp-tr" d="M893-743.87V-933H703.87v73H820v116.13h73Z"/>
              <path class="fp-corner fp-br" d="M893-216.13V-27H703.87v-73H820v-116.13h73Z"/>
              <path class="fp-corner fp-bl" d="M67-216.13V-27H256.13v-73H140v-116.13H67Z"/>
              <!-- Internal Lines -->
              <path class="fp-lines" d="M273-233h414v-494H273v494Zm0 79.22q-31.38 0-55.3-23.92-23.92-23.92-23.92-55.3v-494q0-31.38 23.92-55.3 23.92-23.92 55.3-23.92h414q31.38 0 55.3 23.92 23.92 23.92 23.92 55.3v494q0 31.38-23.92 55.3-23.92 23.92-55.3 23.92H273Zm94.74-413.96h225.09v-65.09H367.74v65.09Zm0 120h225.09v-65.09H367.74v65.09Zm0 120h225.09v-65.09H367.74v65.09ZM273-233v-494 494Z"/>
            </svg>
            <span>Full Page</span>
          </button>
        </div>
      `;

      // Add listeners
      const visibleBtn = guideShadow.querySelector(
        '[data-action="capture-visible"]',
      );
      visibleBtn.onclick = handleCaptureVisible;

      const downloadBtn = guideShadow.querySelector(
        '[data-action="capture-download"]',
      );
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
      saveBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path class="dl-arrow" d="M19 9h-4V3H9v6H5l7 7 7-7z"/><path class="dl-bar" d="M5 18v2h14v-2H5z"/></svg>';
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
    boxHost = null;
    box = null;
    if (overlayHost && overlayHost.parentNode)
      overlayHost.parentNode.removeChild(overlayHost);
    overlayHost = null;
    overlay = null;

    // Animate guide out
    if (guideEl && guideHost) {
      guideEl.classList.add("qs-hiding");
      setTimeout(() => {
        if (guideHost && guideHost.parentNode)
          guideHost.parentNode.removeChild(guideHost);
        guideHost = null;
        guideEl = null;
        guideShadow = null;
      }, 300);
    } else {
      if (guideHost && guideHost.parentNode)
        guideHost.parentNode.removeChild(guideHost);
      guideHost = null;
      guideEl = null;
      guideShadow = null;
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
        canvas.toBlob(
          (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
          "image/png",
        ),
      );

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": lastBlob }),
      ]);
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
        canvas.toBlob(
          (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
          "image/png",
        ),
      );

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": lastBlob }),
      ]);

      // Also download the image
      const url = URL.createObjectURL(lastBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `screenshot-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-")}.png`;
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
    if (guideHost) guideHost.style.display = "none";
    if (statusHost) statusHost.style.display = "none";
    if (boxHost) boxHost.style.display = "none";
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 100));
  }

  // ─── CSS Unrolling Helpers ──────────────────────────────────────────
  // Used to "scroll" the page using CSS transforms rather than real scrolling.
  // This avoids triggering lazy-load, scroll events, and handles fixed elements.

  let _unrollStyle = null;
  let _unrollScrollStyle = null;
  let _originalScrollTop = 0;

  /**
   * Measure the true full-page content height BEFORE any CSS injection.
   * This handles pages like Gemini where html/body have height:100%
   * and scrollHeight on documentElement equals viewport height.
   * We find the inner scrollable element (if any) and use its scrollHeight.
   */
  function measureFullContentHeight() {
    // 1. Check if the page uses window/body scrolling
    const docSH = document.documentElement.scrollHeight;
    const bodySH = document.body.scrollHeight;
    const winH = window.innerHeight;

    // If documentElement or body has scrollable content, use that
    if (docSH > winH + 50 || bodySH > winH + 50) {
      return Math.max(docSH, bodySH);
    }

    // 2. The page likely uses an inner scrollable container (e.g. Gemini, Slack)
    //    Find the largest scrollable element and use its scrollHeight
    const allElements = document.querySelectorAll("*");
    let bestHeight = 0;
    let bestElement = null;
    let bestArea = 0;

    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      if (
        (style.overflowY === "auto" || style.overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight + 50
      ) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          const area = r.width * r.height;
          if (area > bestArea && area > winH * window.innerWidth * 0.2) {
            bestArea = area;
            bestHeight = el.scrollHeight;
            bestElement = el;
          }
        }
      }
    }

    if (bestElement) {
      // Also scroll the inner element to top before capture
      bestElement.scrollTo({ top: 0, behavior: "instant" });

      // The total page height is the scroller's full content PLUS the space
      // occupied by non-scrollable elements (header, footer, input bar, etc.)
      // Non-scroller height = viewport - scroller's visible area
      const nonScrollerHeight = winH - bestElement.clientHeight;
      const totalHeight = bestHeight + nonScrollerHeight;

      console.log("[SwiftSelect] Inner scroller detected:", {
        scrollerTag: bestElement.tagName,
        scrollerScrollHeight: bestHeight,
        scrollerClientHeight: bestElement.clientHeight,
        nonScrollerHeight,
        totalHeight,
      });

      return totalHeight;
    }

    // Fallback: use whatever we have
    return Math.max(docSH, bodySH, winH);
  }

  function applyUnrollCSS(contentHeight) {
    _originalScrollTop = window.scrollY || document.documentElement.scrollTop;
    document.scrollingElement?.scrollTo({ top: 0, behavior: "instant" });

    _unrollStyle = document.createElement("style");
    _unrollStyle.setAttribute("data-swiftselect-unroll", "true");

    // The key insight from the reference extension:
    // Force html to the EXACT content height in pixels, overriding any
    // height:100% or height:auto that the page may have set.
    const heightCSS = contentHeight
      ? `height: ${contentHeight}px !important;`
      : "";

    _unrollStyle.textContent = `
      * {
        transition: none !important;
        animation-play-state: paused !important;
        box-shadow: none !important;
        cursor: none !important;
        pointer-events: none !important;
      }
      html {
        transform: translate3d(0px, var(--scroll-top, 0px), 0px) !important;
        overflow: hidden !important;
        min-height: 100vh !important;
        max-height: none !important;
        ${heightCSS}
      }
      html::-webkit-scrollbar, body::-webkit-scrollbar {
        display: none !important; width: 0 !important; height: 0 !important;
      }
      html, body { scrollbar-width: none !important; }
      *::-webkit-scrollbar {
        display: none !important; width: 0 !important; height: 0 !important;
      }
      * { scrollbar-width: none !important; }
    `;
    document.head.appendChild(_unrollStyle);
  }

  function setUnrollPosition(scrollTop) {
    if (_unrollScrollStyle) _unrollScrollStyle.remove();
    _unrollScrollStyle = document.createElement("style");
    _unrollScrollStyle.setAttribute("data-swiftselect-unroll-scroll", "true");
    _unrollScrollStyle.textContent = `
      html { --scroll-top: ${-scrollTop}px !important; }
    `;
    document.head.appendChild(_unrollScrollStyle);
  }

  function removeUnrollCSS() {
    if (_unrollStyle) {
      _unrollStyle.remove();
      _unrollStyle = null;
    }
    if (_unrollScrollStyle) {
      _unrollScrollStyle.remove();
      _unrollScrollStyle = null;
    }
    window.scrollTo(0, _originalScrollTop);
  }

  // Called by offscreen doc via background relay
  function handleUnrollPage() {
    // STEP 0: Force-clear hover states to hide hover-triggered UI elements
    // (e.g., Gemini's "+" buttons that appear on hover over responses)
    document.activeElement?.blur();
    // Dispatch mouseleave on any currently hovered elements
    const hovered = document.querySelectorAll(":hover");
    hovered.forEach((el) => {
      el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
      el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    });
    // Move "mouse" off-screen to clear all hover states
    document.documentElement.dispatchEvent(
      new MouseEvent("mouseleave", { bubbles: true, clientX: -1, clientY: -1 }),
    );

    // STEP 1: Measure the FULL content height BEFORE CSS injection.
    // This is critical for pages like Gemini where html{height:100%}
    // would make rect.height equal viewport height after CSS.
    const contentHeight = measureFullContentHeight();

    console.log("[SwiftSelect] Pre-CSS contentHeight:", contentHeight);

    // STEP 2: Apply CSS with the forced height — scrolls to top + injects styles
    applyUnrollCSS(contentHeight);

    // STEP 3: Wait a tick, then measure rect AFTER CSS is applied.
    // Now html has height:Xpx, so getBoundingClientRect() returns the true height.
    const rect = document.documentElement.getBoundingClientRect();

    console.log("[SwiftSelect] handleUnrollPage rect:", {
      contentHeight,
      rectHeight: rect.height,
      rectBottom: rect.bottom,
      innerHeight: window.innerHeight,
    });

    // Detect page background color for canvas pre-fill
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const htmlBg = window.getComputedStyle(
      document.documentElement,
    ).backgroundColor;
    // Prefer body bg, fall back to html bg (skip transparent/rgba(0,0,0,0))
    const bgColor =
      bodyBg && bodyBg !== "rgba(0, 0, 0, 0)"
        ? bodyBg
        : htmlBg && htmlBg !== "rgba(0, 0, 0, 0)"
          ? htmlBg
          : null;

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      scrollHeight: Math.max(contentHeight, rect.height),
      rect: { height: rect.height, bottom: rect.bottom },
      rectBottom: rect.bottom,
      bgColor,
    };
  }

  function handleUpdateUnroll(scrollTop) {
    setUnrollPosition(scrollTop);
    const rect = document.documentElement.getBoundingClientRect();
    return {
      rectBottom: rect.bottom,
      rect: { height: rect.height, bottom: rect.bottom },
    };
  }

  function handleRestoreUnroll() {
    removeUnrollCSS();
  }

  function findMainScrollableElement() {
    const bodyScrollHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
    );
    const windowHeight = window.innerHeight;

    if (
      bodyScrollHeight > windowHeight + 100 &&
      window.getComputedStyle(document.body).overflowY !== "hidden" &&
      window.getComputedStyle(document.documentElement).overflowY !== "hidden"
    ) {
      return null; // Window/body scrolling
    }

    const allElements = document.querySelectorAll("*");
    let bestCandidate = null;
    let maxArea = 0;

    for (const el of allElements) {
      const style = window.getComputedStyle(el);
      if (
        (style.overflowY === "auto" || style.overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight
      ) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const area = rect.width * rect.height;
          if (
            area > maxArea &&
            area > window.innerWidth * window.innerHeight * 0.2
          ) {
            maxArea = area;
            bestCandidate = el;
          }
        }
      }
    }

    return bestCandidate;
  }

  /**
   * Capture the visible tab via background script.
   * Retries up to 3 times with exponential backoff to handle
   * Chrome's MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND quota.
   */
  async function captureFrame(retries = 3) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const resp = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: "capture-visible-tab" }, resolve);
        });
        if (resp?.success) return resp.dataUrl;
        const errMsg = resp?.error || "capture-visible-tab failed";
        // If rate-limited, retry after a delay
        if (errMsg.includes("MAX_CAPTURE") && attempt < retries) {
          const delay = 600 * Math.pow(2, attempt); // 600, 1200, 2400ms
          console.log(`[SwiftSelect] Rate limited, retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(errMsg);
      } catch (err) {
        if (attempt >= retries) throw err;
        await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
      }
    }
  }

  async function handleCaptureFullPage() {
    let originalIcon = null;
    let scrollbarStyle = null;
    const btn = guideShadow?.querySelector('[data-action="capture-full"]');

    try {
      ensureUi();
      removeCrosshairCursor();
      removeListeners();
      dragging = false;
      updateBadge("0%");

      originalIcon = btn?.innerHTML;
      if (btn) {
        btn.classList.add("qs-loading");
        const ps = document.createElement("span");
        ps.className = "qs-progress-text";
        ps.textContent = "0%";
        btn.appendChild(ps);
      }

      // Hide UI before capture
      if (guideHost) guideHost.style.display = "none";
      await new Promise((r) => requestAnimationFrame(r));

      // Clear all hover states EARLY so the page has time to process
      // (e.g., Gemini's "+" buttons that appear on hover over responses)
      document.activeElement?.blur();
      const hovered = document.querySelectorAll(":hover");
      hovered.forEach((el) => {
        el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
        el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
      });
      document.documentElement.dispatchEvent(
        new MouseEvent("mouseleave", {
          bubbles: true,
          clientX: -1,
          clientY: -1,
        }),
      );
      // Give the page's JS time to process hover-off events and re-render
      await new Promise((r) => setTimeout(r, 80));

      const dpr = window.devicePixelRatio || 1;
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      console.log(
        "[SwiftSelect] Full page capture — using offscreen document path",
        {
          bodyScrollHeight: document.body.scrollHeight,
          docScrollHeight: document.documentElement.scrollHeight,
          innerHeight: viewportH,
        },
      );

      // ============================================================
      // CSS Unrolling + Tab Capture Stream via Offscreen Document
      // Uses getUserMedia + ImageCapture — NO rate limiting.
      // measureFullContentHeight() inside handleUnrollPage detects
      // inner scrollers (e.g., Gemini, Slack) and forces html height.
      // ============================================================
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { type: "start-fullpage-capture", frameInterval: 50 },
          resolve,
        );
      });

      if (!result || !result.success) {
        throw new Error(result?.error || "Full page capture failed");
      }

      const response = await fetch(result.dataUrl);
      lastBlob = await response.blob();

      updateBadge("100%");
      if (btn) {
        btn.classList.remove("qs-loading");
        btn.querySelector(".qs-progress-text")?.remove();
        btn.classList.add("qs-success");
        btn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg><span>Full Page</span>';
        setTimeout(() => {
          btn.classList.remove("qs-success");
          if (originalIcon) btn.innerHTML = originalIcon;
        }, 2000);
      }

      const url = URL.createObjectURL(lastBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fullpage-${new Date().toISOString().slice(0, 19).replace(/[:.]/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      updateBadge("✓", "#198754");
      setTimeout(() => updateBadge(""), 3000);
      cleanup();
    } catch (err) {
      console.error("Full page capture error:", err);
      removeUnrollCSS();
      if (scrollbarStyle) scrollbarStyle.remove();
      updateBadge("ERR", "#DC3545");
      setTimeout(() => updateBadge(""), 3000);

      if (btn) {
        btn.classList.remove("qs-loading");
        btn.classList.remove("qs-success");
        btn.querySelector(".qs-progress-text")?.remove();
        if (originalIcon) btn.innerHTML = originalIcon;
      }
      setStatus("Capture failed", 3000, "error");
      if (guideHost) guideHost.style.display = "flex";
    }
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;

    const path = e.composedPath();
    // Check if the click is on the guide host or any of its children
    const isOnGuide = path.some(
      (el) =>
        el === guideHost ||
        (el.classList && el.classList.contains("qs-guide-btn")),
    );

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
      // Fix: Ensure dimensions are > 0 to prevent toBlob failures
      const safeSw = Math.max(1, sw);
      const safeSh = Math.max(1, sh);

      canvas.width = safeSw;
      canvas.height = safeSh;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, safeSw, safeSh);

      lastBlob = await new Promise((res, rej) =>
        canvas.toBlob(
          (b) =>
            b
              ? res(b)
              : rej(new Error("toBlob failed - likely 0 dimension or taint")),
          "image/png",
        ),
      );

      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": lastBlob }),
      ]);
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

  function stopProp(e) {
    const path = e.composedPath();
    if (guideHost && path.includes(guideHost)) return;
    if (statusHost && path.includes(statusHost)) return;
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function preventAll(e) {
    const path = e.composedPath();
    if (guideHost && path.includes(guideHost)) return;
    if (statusHost && path.includes(statusHost)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  function nextPaint() {
    return new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
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
    } else if (request.type === "fullpage-action") {
      // Messages relayed from offscreen doc via background
      const { action, data } = request;
      if (action === "unroll-page") {
        const result = handleUnrollPage();
        sendResponse(result);
      } else if (action === "update-unroll") {
        const result = handleUpdateUnroll(data.scrollTop);
        sendResponse(result);
      } else if (action === "restore-unroll") {
        handleRestoreUnroll();
        sendResponse({ ok: true });
      } else {
        sendResponse(null);
      }
    } else if (request.type === "fullpage-progress") {
      // Progress updates from offscreen doc
      const { progress } = request;
      updateBadge(progress + "%");
      const btn = guideShadow?.querySelector('[data-action="capture-full"]');
      if (btn) {
        const span = btn.querySelector(".qs-progress-text");
        if (span) span.textContent = progress + "%";
      }
    }
  });

  // Helper to update badge
  function updateBadge(text, color = "#ff6a61") {
    chrome.runtime.sendMessage({ type: "update-badge", text, color });
  }

  // Initialize
})();
