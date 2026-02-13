// contentScript.js - Restored UI with Material 3 Expressive Motion
(() => {
  if (window.__qsInjected) return;
  window.__qsInjected = true;

  const SHADOW_CSS = `
    /* =========================================
       1. LAYOUT & STRUCTURE (Geometry only)
       ========================================= */
    
    /* UI Overlay */
    .qs-ovl {
      all: initial;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      cursor: crosshair !important;
      user-select: none;
      pointer-events: auto;
    }
    .qs-ovl * {
      cursor: crosshair !important;
    }
    
    /* Selection Box */
    .qs-box {
      all: initial;
      position: absolute;
      border-width: 2px;
      border-style: solid;
      border-radius: 6px;
      pointer-events: none;
      box-sizing: border-box;
    }

    /* Smart Element Highlighter - Dashed Black & White */
    .qs-highlighter {
      all: initial;
      position: absolute;
      /* Dashed Border Trick: Use outline for second color? Or box-shadow? */
      /* Best: dashed white border with thick black box-shadow/outline to make it pop */
      border: 2px dashed #ffffff;
      box-shadow: 0 0 0 2px #1f1f1f, 0 4px 12px rgba(0,0,0,0.3); 
      border-radius: 4px;
      pointer-events: none;
      box-sizing: border-box;
      z-index: 2147483646; 
      transition: all 0.1s ease-out; /* Revert to simpler transition per "dashed" feel */
      display: none;
      
      /* Subtle dark tint inside to confirm selection area */
      background: rgba(31, 31, 31, 0.1);
      
      /* Animation: Subtle scale */
      animation: qs-fade-in 0.15s ease-out forwards;
    }
    
    @keyframes qs-fade-in {
      0% { opacity: 0; transform: scale(0.98); }
      100% { opacity: 1; transform: scale(1); }
    }

    /* Main Menu Container */
    .qs-guide {
      all: initial;
      font-family: 'Google Sans', 'Roboto', system-ui, sans-serif;
      font-weight: 500;
      font-size: 26px;
      
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-style: solid;
      border-width: 0px; /* Default none, but dark mode adds border */
      border-radius: 999px;
      
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
      
      transform-origin: top center;
      animation: expressiveExpand 500ms cubic-bezier(0.2, 0.0, 0.0, 1.0) forwards;
      opacity: 0; 
    }

    .qs-guide.qs-hiding {
      animation: expressiveCollapse 300ms cubic-bezier(0.3, 0.0, 0.8, 0.15) forwards !important;
    }

    .qs-guide-header { display: none; }

    .qs-guide-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Generic Button Layout */
    .qs-guide-btn {
      text-align: center;
      all: initial;
      cursor: pointer;
      background: transparent;
      font-family: inherit;
      font-weight: 700;
      border-width: 2px;
      border-style: solid;
      transition: all 0.3s cubic-bezier(0.2, 0, 0, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      width: auto;
      min-width: 48px;
      height: 48px;
      position: relative;
      gap: 8px;
      box-sizing: border-box;
    }

    .qs-guide-btn svg {
      width: 28px;
      height: 28px;
      fill: currentColor;
      transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    }

    .qs-guide-btn:active {
      transform: scale(0.96);
    }

    /* Segmented Group Layout */
    .qs-segmented {
      display: flex;
      border-radius: 999px;
      padding: 0;
      gap: 8px; 
      height: auto;
      align-items: center;
    }

    /* Visible Area (Left) */
    .qs-segmented .qs-guide-btn:first-child {
      border-radius: 999px;
      padding: 0 16px;
    }

    /* Download Button (Right) */
    .qs-segmented .qs-guide-btn:last-child {
      border-radius: 50%;
      width: 48px;
      height: 48px;
      padding: 0;
      min-width: 48px;
    }
    .qs-segmented .qs-guide-btn:last-child svg {
      width: 24px;
      height: 24px;
    }

    /* Full Page Button Layout (Standalone) */
    .qs-guide-buttons > .qs-guide-btn {
      border-radius: 999px;
      padding: 0 20px;
    }

    /* Theme Toggle Button (Circle override) */
    .qs-guide-buttons > .qs-theme-toggle {
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      padding: 0;
      border-radius: 50%;
      border: none; /* Borderless */
      margin-left: 0; 
      background: transparent;
      box-shadow: none; /* Ensure no shadow */
    }
    
    /* Hover Animation for Theme Toggle */
    .qs-guide-buttons > .qs-theme-toggle:hover {
       background: #1F1F1F; 
       color: #ffffff;
    }
    
    /* Theme Icons */
    .qs-guide-buttons > .qs-theme-toggle svg {
      width: 20px;
      height: 20px;
      transition: transform 0.5s cubic-bezier(0.2, 0, 0, 1);
    }
    .qs-guide-buttons > .qs-theme-toggle:hover svg {
      transform: rotate(180deg);
    }

    .qs-icon-moon { display: none; }
    .qs-theme-dark .qs-icon-moon { display: block; }
    .qs-theme-dark .qs-icon-sun { display: none; }
    
    /* Dark Theme Toggle Hover */
    .qs-theme-dark .qs-guide-buttons > .qs-theme-toggle:hover {
      background: #ffffff !important;
      color: #1a1a1a !important;
    }

    /* Toast / Status Layout */
    .qs-status {
      left: 50%;
      bottom: 40px;
      transform: translate(-50%, 0);
      padding: 12px 24px;
      position: fixed;
      font-family: 'Google Sans', system-ui, sans-serif;
      font-weight: 500;
      font-size: 16px;
      border-radius: 999px;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      pointer-events: none;
      z-index: 2147483648;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 90vw;
      min-height: 52px;
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
    
    /* Variables for Standalone SVG Icons (No Container Background) */
    .qs-status { 
      --qs-icon-fill: #1F1F1F; 
      --qs-icon-stroke: #ffffff; 
    }
    .qs-theme-dark.qs-status { 
      --qs-icon-fill: #ffffff; 
      --qs-icon-stroke: #1a1a1a; 
    }

    /* Status Icon Layout */
    .qs-status-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 800;
      flex-shrink: 0;
    }


    /* Save Button Layout */
    .qs-save-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      margin-left: auto;
      transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
      padding: 0;
      min-width: 40px;
      pointer-events: auto; /* Fix clickability */
    }
    .qs-save-btn svg { width: 22px; height: 22px; fill: currentColor; }


    /* =========================================
       2. LIGHT THEME (Default Colors)
       ========================================= */

    /* Overlay */
    .qs-ovl { background: rgba(0, 0, 0, 0.02); }
    
    /* Selection Box */
    .qs-box {
      border-color: #ffffff;
      box-shadow: 0 0 0 2px #1a1a1a;
      background: rgba(0, 0, 0, 0.04);
    }

    /* Highlighter (Dark Theme Override if needed) */
    .qs-highlighter {
       /* Keep the dashed white + black shadow, works on both modes */
    }

    /* Main Menu */
    .qs-guide {
      color: #1F1F1F;
      background: #D6D6D6; 
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    /* Buttons (Shared Light) */
    .qs-guide-btn {
      color: #1F1F1F;
      border-color: #1F1F1F;
    }
    
    /* Button Hover (Shared Light) */
    .qs-guide-btn:hover {
      background: #1F1F1F;
      color: #ffffff;
      border-color: #1F1F1F;
      /* box-shadow removed by request */
    }

    /* Download Button (Right) - Initial Inverse State */
    .qs-segmented .qs-guide-btn:last-child {
      background: #1F1F1F;
      color: #ffffff;
      border-color: #1F1F1F;
    }
    /* Download Button Hover - Inverts back to Menu Background */
    .qs-segmented .qs-guide-btn:last-child:hover {
      background: #D6D6D6 !important; 
      color: #1F1F1F !important;
      border-color: #1F1F1F !important;
    }
    
    /* Full Page Button specific override needed? 
       No, it follows shared light logic perfectly now without !important */

    /* Status Toasts (Light) */
    .qs-status {
      background: #D6D6D6; /* Match Menu BG */
      color: #1F1F1F;      /* Match Menu Text */
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); /* Match Menu Shadow */
    }
    .qs-status-icon { background: transparent; color: #1F1F1F; }

    .qs-status.qs-success, .qs-status.qs-saved {
      background: #D6D6D6; color: #1F1F1F;
    }
    .qs-status.qs-success .qs-status-icon, .qs-status.qs-saved .qs-status-icon {
      background: transparent; color: #ffffff;
    }
    .qs-status.qs-error {
      background: #D6D6D6; color: #1F1F1F;
    }
    .qs-status.qs-error .qs-status-icon {
      background: transparent; color: #ffffff;
    }
    
    .qs-save-btn { 
      background: #1F1F1F; 
      color: #ffffff;
      border: 2px solid transparent; 
    }
    .qs-save-btn:hover { 
      background: #D6D6D6; 
      color: #1F1F1F; 
      border: 2px solid #1F1F1F; 
    }


    /* =========================================
       3. DARK THEME (Color Overrides)
       ========================================= */

    .qs-theme-dark.qs-guide, .qs-theme-dark .qs-guide {
      background: #1a1a1a;
      border: 0px solid transparent; /* Remove physical border */
      color: #ffffff;
      /* Box Shadow: Outside Border (2px) + Original Drop Shadow */
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25), 0 4px 20px rgba(0, 0, 0, 0.4);
    }

    /* Buttons (Dark) */
    .qs-theme-dark .qs-guide-btn {
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.8);
      background: transparent;
    }

    /* Button Hover (Dark) - Invert to White */
    .qs-theme-dark .qs-guide-btn:hover {
      background: #ffffff !important;
      color: #1a1a1a !important;
      border-color: #ffffff !important;
      /* box-shadow removed by request */
    }
    
    /* Download Button (Dark) - Initial Inverse State (White) */
    .qs-theme-dark .qs-segmented .qs-guide-btn:last-child {
      background: #ffffff;
      color: #1a1a1a;
      border-color: #ffffff;
    }
    /* Download Button Hover (Dark) - Invert back to Dark */
    .qs-theme-dark .qs-segmented .qs-guide-btn:last-child:hover {
      background: #1a1a1a !important;
      color: #ffffff !important;
      border-color: #ffffff !important;
    }
    
    /* Fix Specificity for Standalone Buttons (like Full Page) in Dark Mode 
       Ensure they don't get stuck with light theme if there's any bleed */
    .qs-theme-dark .qs-guide-buttons > .qs-guide-btn {
      border-color: rgba(255, 255, 255, 0.8);
      color: #ffffff;
    }
    .qs-theme-dark .qs-guide-buttons > .qs-guide-btn:hover {
      background: #ffffff !important;
      color: #1a1a1a !important;
    }

    /* Status Toasts (Dark) */
    .qs-theme-dark.qs-status {
      background: #1a1a1a;
      border: 2px solid rgba(255, 255, 255, 0.25);
      color: #ffffff;
    }
    .qs-theme-dark .qs-status-icon, 
    .qs-theme-dark .qs-status.qs-success .qs-status-icon,
    .qs-theme-dark .qs-status.qs-saved .qs-status-icon {
      background: transparent !important;
      color: #ffffff !important;
    }
    .qs-theme-dark .qs-save-btn,
    .qs-theme-dark .qs-status.qs-success .qs-save-btn {
      background: #ffffff !important;
      color: #1a1a1a !important;
    }
    .qs-theme-dark .qs-save-btn:hover,
    .qs-theme-dark .qs-status.qs-success .qs-save-btn:hover {
      background: #1a1a1a !important;
      color: #ffffff !important;
      border: 1px solid #ffffff;
    }

    /* =========================================
       4. ANIMATIONS & EXTRAS
       ========================================= */
       
    /* ... (Keep existing complex animations) ... */
    
    /* Tooltip */
    .qs-guide-btn::before {
      content: attr(data-tooltip);
      position: absolute;
      bottom: -34px;
      left: 50%;
      transform: translateX(-50%) scale(0.8);
      background: rgba(28, 27, 31, 0.9); /* Default Dark Tooltip */
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
    
    /* Dark Theme Tooltip - Invert */
    .qs-theme-dark .qs-guide-btn::before {
      background: rgba(255, 255, 255, 0.9);
      color: #1a1a1a;
    }

    /* Loader, HUD, Flash */
    .qs-guide-btn.qs-loading { pointer-events: none; opacity: 0.6; }
    .qs-guide-btn.qs-loading svg { opacity: 0; }
    .qs-guide-btn.qs-loading::after {
      content: "";
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white; /* Default White loader */
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    /* HUD */
    .qs-hud {
      position: fixed;
      background: #ffffff;
      color: #1a1a1a;
      padding: 6px 12px;
      border-radius: 50px;
      font-size: 12px;
      font-family: 'Google Sans', system-ui, sans-serif;
      font-weight: 500;
      pointer-events: none;
      z-index: 2147483649;
      display: none;
      white-space: nowrap;
      border: 1px solid rgba(0, 0, 0, 0.15);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      line-height: 1;
      transform: none !important; 
    }
    .qs-theme-dark.qs-hud {
      background: #1a1a1a;
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Flash */
    .qs-flash {
      position: fixed;
      background: white;
      z-index: 2147483650;
      pointer-events: none;
      opacity: 0;
      animation: qs-flash-anim 0.4s ease-out forwards;
    }
    .qs-flash.qs-flash-inverse { background: #1a1a1a; }
    
    @keyframes qs-flash-anim { 0% { opacity: 0.6; } 100% { opacity: 0; } }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes expressiveExpand { 0% { transform: translateY(-20px) scale(0.8); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
    @keyframes expressiveCollapse { 0% { transform: translateY(0) scale(1); opacity: 1; } 100% { transform: translateY(-10px) scale(0.9); opacity: 0; } }
    @keyframes expressiveSlideUp { 0% { transform: translate(-50%, 20px) scale(0.95); opacity: 0; } 100% { transform: translate(-50%, 0) scale(1); opacity: 1; } }
    @keyframes expressiveSlideDown { 0% { transform: translate(-50%, 0) scale(1); opacity: 1; } 100% { transform: translate(-50%, 15px) scale(0.95); opacity: 0; } }
    
    /* Responsive */
    @media (max-width: 900px) {
      .qs-guide { padding: 8px; }
      .qs-guide-btn { height: 48px; min-width: 48px; font-size: 14px; padding: 0 16px; }
      .qs-guide-btn svg { width: 24px; height: 24px; }
      .qs-segmented .qs-guide-btn { height: 40px; }
      .qs-segmented .qs-guide-btn:last-child { width: 40px; height: 40px; min-width: 40px; }
      .qs-segmented .qs-guide-btn:last-child svg { width: 20px; height: 20px; }
      .qs-status { padding: 10px 20px; min-height: 48px; font-size: 14px; bottom: 32px; }
      .qs-status-icon { width: 24px; height: 24px; font-size: 14px; }
      .qs-save-btn { width: 36px; height: 36px; min-width: 36px; }
      .qs-save-btn svg { width: 20px; height: 20px; }
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
      .qs-save-btn { width: 32px; height: 32px; min-width: 32px; }
      .qs-save-btn svg { width: 16px; height: 16px; }
    }

    /* Animations (Eye, Bounce, Full Page corners) */
    @keyframes eyeBlink { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(0.1); } }
    @keyframes eyeLook { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-1px, 0); } 75% { transform: translate(1px, 0); } }
    .qs-guide-btn:hover .eye-lid { animation: eyeBlink 0.4s ease-in-out; transform-origin: center; }
    .qs-guide-btn:hover .eye-pupil { animation: eyeLook 0.8s ease-in-out; }
    
    @keyframes dlBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
    .qs-guide-btn:hover .dl-arrow, .qs-save-btn:hover .dl-arrow { animation: dlBounce 0.6s ease-in-out; }

    @keyframes cornerMoveTL { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(40px, 40px); } }
    @keyframes cornerMoveTR { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-40px, 40px); } }
    @keyframes cornerMoveBR { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-40px, -40px); } }
    @keyframes cornerMoveBL { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(40px, -40px); } }
    @keyframes lineWipe { 0% { clip-path: inset(0 100% 0 0); opacity: 0; } 20% { opacity: 1; } 100% { clip-path: inset(0 0 0 0); opacity: 1; } }
    
    .qs-guide-btn:hover .fp-tl { animation: cornerMoveTL 0.5s ease-in-out; }
    .qs-guide-btn:hover .fp-tr { animation: cornerMoveTR 0.5s ease-in-out; }
    .qs-guide-btn:hover .fp-br { animation: cornerMoveBR 0.5s ease-in-out; }
    .qs-guide-btn:hover .fp-bl { animation: cornerMoveBL 0.5s ease-in-out; }
    .qs-guide-btn:hover .fp-inner-lines { animation: lineWipe 0.6s cubic-bezier(0.2, 0, 0, 1); }
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

  let overlayHost, boxHost, statusHost, guideHost, highlighterHost, hudHost;
  let overlay, box, statusEl, guideEl, guideShadow, highlighterEl, hudEl;
  let dragging = false;
  let isMoving = false; // Spacebar Drag
  let startX = 0,
    startY = 0;
  // Track last mouse pos for moving logic
  let lastMouseX = 0,
    lastMouseY = 0;
  let rect = { left: 0, top: 0, width: 0, height: 0 };
  let lastBlob = null;
  let highlightedRect = null;

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

    if (!highlighterHost) {
      const { host, el } = makeShadowOverlay("div", "qs-highlighter");
      highlighterHost = host;
      highlighterEl = el;
      // Host needs to be clickable? No, pointer-events none on host, but we need to click *through* it?
      // Actually makeShadowOverlay sets pointer-events: none on host.
      // We want mousemove to pass through to the page elements so we can detect them.
      // So highlighterHost stays pointer-events: none.
    }

    if (!hudHost) {
      const { host, el } = makeShadowOverlay("div", "qs-hud");
      hudHost = host;
      hudEl = el;
      // Initial style for corner rounding
      hudEl.style.borderBottomRightRadius = "6px";
    }

    // Apply Theme to HUD immediately if it exists (captured from previous calls)
    if (hudEl) {
      if (shouldUseDarkMode()) {
        hudEl.classList.add("qs-theme-dark");
      } else {
        hudEl.classList.remove("qs-theme-dark");
      }
    }

    if (!guideHost) {
      const { host, el, shadow } = makeShadowOverlay("div", "qs-guide");
      guideHost = host;
      guideEl = el;
      guideShadow = shadow;

      guideEl.innerHTML = `
        <div class="qs-guide-buttons">
          <div class="qs-segmented">
            <button class="qs-guide-btn" data-action="capture-visible" data-tooltip="Copy Visible">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path class="eye-lid" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                <circle class="eye-pupil" cx="12" cy="12" r="3"/>
              </svg>
              <span>Visible Area</span>
            </button>
            <button class="qs-guide-btn" data-action="capture-download" data-tooltip="Save & Copy">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path class="dl-arrow" d="M19 9h-4V3H9v6H5l7 7 7-7z"/>
                <path class="dl-bar" d="M5 18v2h14v-2H5z"/>
              </svg>
            </button>
          </div>
          <button class="qs-guide-btn" data-action="capture-full" data-tooltip="Save Full Page">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
              <!-- Split Corners (Original Material Icon) -->
              <path class="fp-corner fp-tl" d="M67-743.87V-933h189.13v73H140v116.13H67Z"/>
              <path class="fp-corner fp-tr" d="M893-743.87V-933H703.87v73H820v116.13h73Z"/>
              <path class="fp-corner fp-br" d="M893-216.13V-27H703.87v-73H820v-116.13h73Z"/>
              <path class="fp-corner fp-bl" d="M67-216.13V-27H256.13v-73H140v-116.13H67Z"/>
              <!-- Internal Lines -->
              <path class="fp-box" d="M273-233h414v-494H273v494Zm0 79.22q-31.38 0-55.3-23.92-23.92-23.92-23.92-55.3v-494q0-31.38 23.92-55.3 23.92-23.92 55.3-23.92h414q31.38 0 55.3 23.92 23.92 23.92 23.92 55.3v494q0 31.38-23.92 55.3-23.92 23.92-55.3 23.92H273Z"/>
              <path class="fp-inner-lines" d="M367.74-567.74h225.09v-65.09H367.74v65.09Zm0 120h225.09v-65.09H367.74v65.09Zm0 120h225.09v-65.09H367.74v65.09Z"/>
            </svg>
            <span>Full Page</span>
          </button>
          <button class="qs-guide-btn qs-theme-toggle" data-action="toggle-theme" data-tooltip="Toggle Theme">
            <!-- Moon (Show in Light Mode) -->
            <svg class="qs-icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-5.4-5.4 5.4 5.4 0 0 1 1.76-3.79A8.93 8.93 0 0 0 12 3Z"/>
            </svg>
            <!-- Sun (Show in Dark Mode) -->
            <svg class="qs-icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 24 24">
              <path d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-15a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V1a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zM1 9h2a1 1 0 1 1 0 2H1a1 1 0 0 1 0-2zm16 0h2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2zm.071-6.071a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM5.757 14.243a1 1 0 0 1 0 1.414L4.343 17.07a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM4.343 2.929l1.414 1.414a1 1 0 0 1-1.414 1.414L2.93 4.343A1 1 0 0 1 4.343 2.93zm11.314 11.314l1.414 1.414a1 1 0 0 1-1.414 1.414l-1.414-1.414a1 1 0 1 1 1.414-1.414z"/>
            </svg>
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

      const themeBtn = guideShadow.querySelector(
        '[data-action="toggle-theme"]',
      );
      themeBtn.onclick = handleThemeToggle;
    }

    // Ensure guide is visible AND RESET ANIMATION CLASS
    if (guideHost) {
      guideHost.style.display = "flex";
      guideEl.classList.remove("qs-hiding");

      // Apply initial theme
      applyTheme(currentUserTheme);

      // Force Reflow to restart enter animation if needed
      void guideEl.offsetWidth;
    }
  }

  // --- Theme Management ---
  let currentUserTheme = "light"; // Default

  // Load preference immediately
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get("userTheme", (data) => {
      if (data.userTheme) {
        currentUserTheme = data.userTheme;
      }
    });
  }

  function handleThemeToggle() {
    currentUserTheme = currentUserTheme === "light" ? "dark" : "light";
    applyTheme(currentUserTheme);
    chrome.storage.local.set({ userTheme: currentUserTheme });
  }

  function applyTheme(theme) {
    if (!guideEl) return;
    if (theme === "dark") {
      guideEl.classList.add("qs-theme-dark");
      if (hudEl) hudEl.classList.add("qs-theme-dark");
    } else {
      guideEl.classList.remove("qs-theme-dark");
      if (hudEl) hudEl.classList.remove("qs-theme-dark");
    }
  }

  function shouldUseDarkMode() {
    // Deprecated: relying on user preference now
    return currentUserTheme === "dark";
  }

  function isPageDark() {
    // 1. Check Page Brightness.
    try {
      const bodyColor = window.getComputedStyle(document.body).backgroundColor;
      const rgb = bodyColor.match(/\d+/g);
      if (rgb && rgb.length >= 3) {
        // Luminance formula: 0.2126*R + 0.7152*G + 0.0722*B
        const r = parseInt(rgb[0]);
        const g = parseInt(rgb[1]);
        const b = parseInt(rgb[2]);
        const alpha = rgb.length > 3 ? parseFloat(rgb[3]) : 1;

        // If transparent, assume Light mode (most sites default to white bg)
        // OR check HTML tag? Let's check HTML tag if body is transparent.
        if (alpha < 0.1) {
          // Check html tag
          const htmlColor = window.getComputedStyle(
            document.documentElement,
          ).backgroundColor;
          const rgbH = htmlColor.match(/\d+/g);
          if (rgbH && rgbH.length >= 3) {
            const rH = parseInt(rgbH[0]);
            const gH = parseInt(rgbH[1]);
            const bH = parseInt(rgbH[2]);
            const lumaH = 0.2126 * rH + 0.7152 * gH + 0.0722 * bH;
            return lumaH < 128; // < 128 is Dark
          }
          // if html is also transparent, default to Light?
          // Users usually see White background if everything is transparent.
          return false;
        }

        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luma < 128; // Dark Page -> Use Dark Mode UI (White Flash)
      }
    } catch (e) {
      // Fallback
    }
    return false; // Default to Light Mode (Black Flash)
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

    // Select Icon based on Type/Message
    let iconSvg = "";
    // Info / Default
    iconSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.17,15.4l-5.91-9.85C14.48,4.25,13.3,3.51,12,3.51S9.52,4.25,8.74,5.54L2.83,15.4c-0.44,0.73-0.66,1.49-0.66,2.21c0,0.57,0.14,1.13,0.42,1.62C3.23,20.35,4.47,21,6,21h12c1.53,0,2.77-0.65,3.41-1.77c0.28-0.49,0.42-1.02,0.42-1.58C21.84,16.91,21.62,16.14,21.17,15.4z M12,8.45c0.85,0,1.55,0.7,1.55,1.55c0,0.85-0.69,1.55-1.55,1.55c-0.85,0-1.55-0.7-1.55-1.55C10.45,9.14,11.14,8.45,12,8.45z M13.69,16.91c-0.03,0.04-0.8,0.92-2.07,0.92l-0.15,0c-0.51-0.03-0.93-0.25-1.18-0.63c-0.31-0.47-0.36-1.11-0.12-1.82l0.41-1.22c0.23-0.68,0.01-0.79-0.11-0.85l-0.14-0.02c-0.25,0-0.6,0.15-0.71,0.21c-0.1,0.05-0.23,0.03-0.31-0.07c-0.07-0.1-0.07-0.23,0.01-0.32c0.03-0.04,0.87-0.99,2.22-0.91c0.51,0.03,0.93,0.25,1.18,0.63c0.32,0.47,0.36,1.11,0.12,1.83l-0.41,1.22c-0.23,0.68-0.01,0.79,0.11,0.85l0.14,0.02c0.25,0,0.6-0.15,0.71-0.2c0.11-0.06,0.23-0.03,0.31,0.07C13.77,16.69,13.77,16.82,13.69,16.91z"/></svg>';

    if (type === "error") {
      // Cross SVG
      iconSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 51.976 51.976"><path d="M44.373,7.603c-10.137-10.137-26.632-10.138-36.77,0c-10.138,10.138-10.137,26.632,0,36.77s26.632,10.138,36.77,0C54.51,34.235,54.51,17.74,44.373,7.603z M36.241,36.241c-0.781,0.781-2.047,0.781-2.828,0l-7.425-7.425l-7.778,7.778c-0.781,0.781-2.047,0.781-2.828,0c-0.781-0.781-0.781-2.047,0-2.828l7.778-7.778l-7.425-7.425c-0.781-0.781-0.781-2.048,0-2.828c0.781-0.781,2.047-0.781,2.828,0l7.425,7.425l7.071-7.071c0.781-0.781,2.047-0.781,2.828,0c0.781,0.781,0.781,2.047,0,2.828l-7.071,7.071l7.425,7.425C37.022,34.194,37.022,35.46,36.241,36.241z"/></svg>';
    } else if (type === "success" || type === "saved") {
      // Tick SVG (Tick Only - No Background)
      // Uses var(--qs-icon-fill) for stroke to ensure it is Dark in Light Mode and White in Dark Mode
      iconSvg =
        '<svg width="100%" height="100%" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke="var(--qs-icon-fill)" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="m1.75 9.75 2.5 2.5m3.5-4 2.5-2.5m-4.5 4 2.5 2.5 6-6.5"/></svg>';
    }

    // Set SVG content (ensure fill/stroke inherits correctly)
    iconEl.innerHTML = iconSvg;
    // Force SVG styling to fit container
    const svgEl = iconEl.querySelector("svg");
    if (svgEl) {
      if (iconSvg.includes("var(--qs-icon-fill)")) {
        svgEl.style.width = "28px";
        svgEl.style.height = "28px";
        svgEl.style.paddingBottom = "2px"; // Visually center the tick
      } else {
        svgEl.style.width = "100%";
        svgEl.style.height = "100%";
      }
      // Note: Stroke/Fill logic for the tick is handled inline in the SVG
      if (!iconSvg.includes("var(--qs-icon-fill")) {
        // Fallback for Info/Error which are standard filled or stroked
        if (iconSvg.includes("stroke") && !iconSvg.includes("fill")) {
          svgEl.style.fill = "none";
          svgEl.style.stroke = "currentColor";
        } else {
          svgEl.style.fill = "currentColor";
        }
      }
    }

    statusEl.appendChild(iconEl);

    const textSpan = document.createElement("span");
    textSpan.textContent = msg;
    statusEl.appendChild(textSpan);

    if (type === "success") {
      statusEl.classList.add("qs-success");
      const saveBtn = document.createElement("button");
      saveBtn.className = "qs-save-btn";
      // Download SVG
      saveBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path class="dl-arrow" d="M19 9h-4V3H9v6H5l7 7 7-7z"/><path class="dl-bar" d="M5 18v2h14v-2H5z"/></svg>';
      // Fix svg size in button
      const downSvg = saveBtn.querySelector("svg");
      if (downSvg) {
        downSvg.style.width = "20px";
        downSvg.style.height = "20px";
        downSvg.style.fill = "currentColor";
      }

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

    // Auto-Theme for Status
    if (shouldUseDarkMode()) {
      statusEl.classList.add("qs-theme-dark");
    } else {
      statusEl.classList.remove("qs-theme-dark");
    }

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

    if (highlighterHost && highlighterHost.parentNode)
      highlighterHost.parentNode.removeChild(highlighterHost);
    highlighterHost = null;
    highlighterEl = null;
    highlightedRect = null;

    if (hudHost && hudHost.parentNode) hudHost.parentNode.removeChild(hudHost);
    hudHost = null;
    hudEl = null;

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
    isMoving = false;
  }

  function handleSaveAction() {
    if (!lastBlob) return;

    // Save the file first
    const url = URL.createObjectURL(lastBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getSmartFilename("screenshot");
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
          textSpan.textContent = "Image Saved";
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
      triggerFlash(); // Full screen flash for visible area
      setStatus("Copied to clipboard", 5000, "success");
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
      a.download = getSmartFilename("screenshot");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      triggerFlash(); // Flash on Download

      setStatus("Copied & Saved", 5000, "saved");
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
    if (highlighterHost) highlighterHost.style.display = "none";
    if (hudHost) hudHost.style.display = "none";
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

      // HIDE CURSOR IMMEDIATELY (Global Override)
      const originalCursor = document.documentElement.style.cursor;
      document.documentElement.style.cursor = "none !important";
      document.body.style.cursor = "none !important";

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

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": lastBlob }),
      ]);

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
      a.download = getSmartFilename("fullpage");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      updateBadge("✓", "#198754");
      // Use "saved" type so no button is added, but still uses the checkmark icon
      setStatus("Page Saved Successfully", 5000, "saved");
      setTimeout(() => updateBadge(""), 3000);
      // triggerFlash(); // Full screen flash REMOVED per user request

      // RESTORE CURSOR
      document.documentElement.style.cursor = "";
      document.body.style.cursor = "";

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

      // RESTORE CURSOR ON ERROR
      document.documentElement.style.cursor = "";
      document.body.style.cursor = "";

      setStatus("Capture Failed", 3000, "error");
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
    isMoving = false; // Reset moving state on new drag
    startX = e.clientX;
    startY = e.clientY;
    lastMouseX = startX;
    lastMouseY = startY;
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

  let snapTimer = null;

  function onMouseMove(e) {
    const x = e.clientX;
    const y = e.clientY;

    // Spacebar Move Logic
    // If Space is held, we MOVE the rect instead of resizing
    // We check space key state via e.code or a tracked variable?
    // MouseEvent has no e.code for held keys reliably except modifier flags (e.shiftKey, e.altKey, e.ctrlKey, e.metaKey).
    // Space is NOT a modifier. We must rely on 'keydown/keyup' tracking or e.getModifierState?
    // User requested: "While dragging, if user holds SPACEBAR..."
    // We'll use a global tracker for Space since it's not in standard modifiers.

    if (dragging && isSpacePressed) {
      if (!isMoving) {
        isMoving = true; // Start moving
      }
      const dx = x - lastMouseX;
      const dy = y - lastMouseY;

      rect.left += dx;
      rect.top += dy;

      // Update startX/startY so resizing resumes from new position relative to anchor
      startX += dx;
      startY += dy;

      lastMouseX = x;
      lastMouseY = y;

      updateBox();
      updateHud(rect, x, y);
      return;
    } else {
      isMoving = false;
      lastMouseX = x;
      lastMouseY = y;
    }

    if (!dragging) {
      if (box) box.style.display = "none";

      // DEBOUNCE: Clear previous timer
      if (snapTimer) clearTimeout(snapTimer);

      // FIX AGGRESSIVE HIDING:
      // Do NOT hide immediately. Let the timer decide if we found a new target or lost the old one.
      // However, if we moved VERY far (e.g. outside the rect), maybe we should hint?
      // But user said "little movement inside... make it disappear" was the problem.
      // So removing the immediate hide solves that.
      // The debounce timer will update or clear it naturally.

      // if (highlighterEl) highlighterEl.style.display = "none";
      // highlightedRect = null;

      // OPT-IN CHECK: Ctrl (or Meta) key REQUIRED again.
      const isSnapping = e.ctrlKey || e.metaKey;
      if (!isSnapping) {
        // If not holding Ctrl, hide existing highlighter immediately (so it feels responsive when releasing key)
        if (highlighterEl) highlighterEl.style.display = "none";
        highlightedRect = null;
        if (hudEl) hudEl.style.display = "none";
        return;
      }
      // const isSnapping = true; // REVERTED

      // Set new timer for "Hover Intent"
      snapTimer = setTimeout(() => {
        // Smart Element Snapping Logic
        const elements = document.elementsFromPoint(x, y);
        let bestCandidate = null;

        // Helper to determine if an element is worth snapping to
        const isSignificant = (el) => {
          const r = el.getBoundingClientRect();
          const vw = window.innerWidth;
          const vh = window.innerHeight;

          // 1. Min Size Check
          if (r.width < 50 || r.height < 50) return false;

          // 2. Viewport Visiblity Check
          if (
            r.top < -1 ||
            r.left < -1 ||
            r.bottom > vh + 1 ||
            r.right > vw + 1
          )
            return false;

          const tagName = el.tagName.toUpperCase();
          if (tagName === "BODY" || tagName === "HTML") return false;

          // 3. Media Exception (Media tags can be big, everything else cannot)
          const isMedia = [
            "IMG",
            "VIDEO",
            "SVG",
            "CANVAS",
            "IFRAME",
            "EMBED",
            "OBJECT",
          ].includes(tagName);
          const isInteractive = [
            "INPUT",
            "TEXTAREA",
            "SELECT",
            "BUTTON",
            "A",
          ].includes(tagName);

          // 4. UNIVERSAL SIZE CAP (The "No Giants" Rule) - RELAXED
          // If it's NOT media, and it's huge (> 95% of screen), REJECT IT.
          if (!isMedia) {
            if (r.width > vw * 0.95 || r.height > vh * 0.95) return false;
          }

          const style = window.getComputedStyle(el);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0"
          )
            return false;

          // 5. Media & Interactive are always significant (if they passed size check, though media bypasses it)
          if (isMedia || isInteractive) return true;

          // 6. Styling Check
          const hasBgImage = style.backgroundImage !== "none";
          const hasBgColor =
            style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
            style.backgroundColor !== "transparent";
          const hasBorder =
            style.borderWidth !== "0px" &&
            style.borderStyle !== "none" &&
            style.borderColor !== "transparent";
          const hasBoxShadow = style.boxShadow !== "none";

          // 7. UNIVERSAL "Hollow Box" Killer
          // If it's a large box (>300px) with NO border and NO image, it's likely just a background container.
          if (r.width > 300 && r.height > 300) {
            if (!hasBorder && !hasBgImage && !hasBoxShadow) {
              // If it has a color but no text -> Reject
              // If it has nothing -> Reject
              const text = el.innerText ? el.innerText.trim() : "";
              if (text.length < 10) return false; // Reduced from 20 to 10
            }
          }

          if (hasBgImage || hasBgColor || hasBorder || hasBoxShadow)
            return true;

          // 8. Final Content Fallback
          if (el.innerText && el.innerText.trim().length > 0) return true;

          return false;
        };

        for (const candidate of elements) {
          const isExtensionUi =
            candidate === guideHost ||
            candidate === statusHost ||
            candidate === overlayHost ||
            candidate === boxHost ||
            candidate === highlighterHost ||
            candidate === guideEl ||
            candidate === statusEl ||
            candidate === box ||
            candidate === highlighterEl ||
            candidate.closest?.(".qs-guide") ||
            candidate.closest?.(".qs-status") ||
            candidate.classList?.contains("qs-ovl");

          if (!isExtensionUi) {
            if (isSignificant(candidate)) {
              bestCandidate = candidate;
              break;
            }
          }
        }

        if (bestCandidate && highlighterEl) {
          const r = bestCandidate.getBoundingClientRect();
          highlighterEl.style.display = "block";
          highlighterEl.style.left = r.left + "px";
          highlighterEl.style.top = r.top + "px";
          highlighterEl.style.width = r.width + "px";
          highlighterEl.style.height = r.height + "px";
          highlightedRect = r;
          // For smart snapping, mouse is at (x,y). Use that as "cursor" for opposite calculation.
          updateHud(r, x, y);
        } else {
          // No valid target found
          if (highlighterEl) highlighterEl.style.display = "none";
          highlightedRect = null;
          if (hudEl) hudEl.style.display = "none";
        }
      }, 150); // Reduced from 300ms to 150ms for snappier feel

      return;
    }

    // If dragging, hide highlighter immediately
    if (highlighterEl) highlighterEl.style.display = "none";
    highlightedRect = null;
    if (box) box.style.display = "block";

    let width, height;

    if (e.shiftKey) {
      // Square Lock
      const rawW = Math.abs(x - startX);
      const rawH = Math.abs(y - startY);
      const size = Math.max(rawW, rawH);
      width = size;
      height = size;

      // Adjust left/top based on direction
      // If x < startX, left = startX - size
      // If y < startY, top = startY - size
      rect.left = x < startX ? startX - size : startX;
      rect.top = y < startY ? startY - size : startY;
    } else {
      const left = Math.min(startX, x);
      const top = Math.min(startY, y);
      width = Math.abs(x - startX);
      height = Math.abs(y - startY);
      rect.left = left;
      rect.top = top;
    }

    rect.width = width;
    rect.height = height;
    updateBox();
    // Use current mouse position (x, y) for opposite calculation
    updateHud(rect, x, y);
  }

  function onMouseUp(e) {
    if (!dragging) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    dragging = false;
    updateBox();

    // If click (no drag), cancel selection OR capture snapped element
    if (rect.width < 5 || rect.height < 5) {
      if (highlightedRect) {
        // Smart Capture!
        captureAndCrop(highlightedRect).finally(() => {
          cleanup();
          triggerFlash(highlightedRect);
          setStatus("Copied to clipboard", 5000, "success");
        });
        return;
      }

      setStatus("Canceled", 1500);
      cleanup();
      return;
    }

    captureAndCrop(rect).finally(() => {
      cleanup();
      // triggerFlash(rect); // Removed per user: No flash on selection
      setStatus("Copied to clipboard", 5000, "success");
    });
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      setStatus("Canceled", 900);
      cleanup();
    }
  }

  // Right-Click to Cancel
  window.addEventListener("contextmenu", (e) => {
    if (dragging || (rect.width > 0 && rect.height > 0)) {
      e.preventDefault();
      setStatus("Canceled", 900);
      cleanup();
    }
  });

  // Track Spacebar
  let isSpacePressed = false;
  window.addEventListener(
    "keydown",
    (e) => {
      if (e.code === "Space") {
        isSpacePressed = true;
        // Prevent scrolling if dragging
        if (dragging) e.preventDefault();
      }
    },
    { capture: true },
  ); // Capture to prevent page scroll blocking us

  window.addEventListener(
    "keyup",
    (e) => {
      if (e.code === "Space") {
        isSpacePressed = false;
        isMoving = false;
      }
    },
    { capture: true },
  );

  function updateBox() {
    if (!box) return;
    box.style.left = rect.left + "px";
    box.style.top = rect.top + "px";
    box.style.width = rect.width + "px";
    box.style.height = rect.height + "px";
  }

  function updateHud(rect, x, y) {
    if (!hudEl || !hudHost) return;

    // Premium "Floating Pill" Positioning
    // Top-Left corner, slightly separated.
    const gap = 8;
    const hudHeight = 26; // Approx

    let top = rect.top + gap;
    let left = rect.left + gap;

    // Smart Flip: If box is too narrow or short, move HUD outside to avoid overcrowding
    // Or if dragging up/left, keep it attached to the visual top-left.

    // Simplest Premium: Inside Top-Left.
    // Clip check: If box < 100px wide, move outside top.
    if (rect.width < 100 || rect.height < 40) {
      top = rect.top - hudHeight - gap;
    }

    hudEl.style.top = top + "px";
    hudEl.style.left = left + "px";
    hudEl.style.transform = ""; // Reset custom transforms

    // Position fixed, so coordinates are client relative.
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    hudEl.textContent = `${w} x ${h}`;
    hudEl.style.display = "block";
    hudHost.style.display = "block";
  }

  function triggerFlash(targetRect = null) {
    const { host, el } = makeShadowOverlay("div", "qs-flash");

    // Smart Flash: White on Dark Page, Black on Light Page
    // Use isPageDark() irrespective of extension theme
    if (!isPageDark()) {
      el.classList.add("qs-flash-inverse"); // Light Page -> Black Flash
    }

    if (targetRect) {
      el.style.left = targetRect.left + "px";
      el.style.top = targetRect.top + "px";
      el.style.width = targetRect.width + "px";
      el.style.height = targetRect.height + "px";
      el.style.position = "absolute"; // Important for rect positioning
      el.style.borderRadius = "6px"; // Match selection box roundness
    } else {
      el.style.inset = "0"; // Full screen
      el.style.borderRadius = "0";
    }

    // Auto remove after animation
    setTimeout(() => {
      if (host && host.parentNode) host.parentNode.removeChild(host);
    }, 450); // Slightly longer than 0.4s animation
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

  function getSmartFilename(type) {
    let title = document.title || "";
    // Sanitize: remove invalid chars for filenames
    // Windows: < > : " / \ | ? *
    // Control chars: \x00-\x1F
    title = title.replace(/[<>:"\/\\|?*\x00-\x1F]/g, " ");
    title = title.trim().replace(/\s+/g, " "); // collapse spaces

    // Truncate to 100 chars to be safe
    if (title.length > 100) {
      title = title.substring(0, 100).trim();
    }

    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");

    if (title) {
      return `${title} - ${type} - ${timestamp}.png`;
    } else {
      return `${type} - ${timestamp}.png`;
    }
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
