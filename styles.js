if (!window.SwiftSelect) window.SwiftSelect = {};

if (!window.SwiftSelect.styles) {
  window.SwiftSelect.styles = {
    SHADOW_CSS: `
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
      font-size: 14px; 
      
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-style: solid;
      border-width: 0px; 
      border-radius: 999px;
      
      pointer-events: auto;
      z-index: 2147483648;
      display: flex;
      align-items: center; /* Enforce vertical centering */
      justify-content: center;
      flex-direction: row;
      gap: 0; 
      top: 24px;
      right: 24px;
      padding: 16px; 
      position: fixed;
      min-width: auto;
      max-width: none; /* Ensure no constraint on zoom */
      white-space: nowrap; /* Never wrap */
      
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
      gap: 12px; 
      margin: 0;
      flex-shrink: 0; /* Prevent squishing */
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
      gap: 10px;
      box-sizing: border-box;
      white-space: nowrap;
      line-height: normal; /* Fix vertical alignment issues */
      flex-shrink: 0; /* Prevent squishing on zoom */
    }

    .qs-guide-btn svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
      transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
      display: block; /* Remove inline-block gaps */
    }

    .qs-guide-btn:active {
      transform: scale(0.96);
    }

    /* Segmented Group Layout */
    .qs-segmented {
      display: flex;
      border-radius: 999px;
      padding: 0;
      gap: 12px; 
      height: auto;
      align-items: center;
      flex-shrink: 0;
    }

    /* Visible Area (Left) */
    .qs-segmented .qs-guide-btn:first-child {
      border-radius: 999px;
      padding: 0 20px; 
    }

    /* Download Button (Right) */
    .qs-segmented .qs-guide-btn:last-child {
      border-radius: 50%;
      margin-left: 0; 
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
      padding: 0 24px; 
    }

    /* Theme Toggle Button (Circle override) */
    .qs-guide-buttons > .qs-theme-toggle {
      width: 24px !important; /* EXACT match to icon size */
      height: 24px !important;
      min-width: 24px !important;
      padding: 0 !important;
      border-radius: 50%;
      border: 0 solid transparent !important; /* Zero border */
      margin-left: 0; 
      background: transparent !important;
      box-shadow: none !important;
      outline: none !important;
    }
    
    /* Hover Animation for Theme Toggle */
    .qs-guide-buttons > .qs-theme-toggle:hover {
       background: transparent !important; 
       color: #1F1F1F !important;
       border-color: transparent !important;
       box-shadow: none !important;
    }
    
    /* Theme Icons - FIX SPECIFICITY */
    .qs-guide-buttons > .qs-theme-toggle svg {
      width: 24px; 
      height: 24px;
      transition: transform 0.5s cubic-bezier(0.2, 0, 0, 1);
    }
    .qs-guide-buttons > .qs-theme-toggle:hover svg {
      transform: rotate(180deg);
    }

    /* Force display states with !important to override .qs-guide-btn svg */
    .qs-icon-moon { display: none !important; }
    .qs-icon-sun { display: block !important; }
    
    .qs-theme-dark .qs-icon-moon { display: block !important; }
    .qs-theme-dark .qs-icon-sun { display: none !important; }
    
    /* Dark Theme Toggle Hover */
    .qs-theme-dark .qs-guide-buttons > .qs-theme-toggle:hover {
      background: transparent !important;
      color: #ffffff !important;
      border-color: transparent !important;
      box-shadow: none !important;
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
      border-color: #ffffff !important;
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
       4. GLASS THEME (Mint)
       ========================================= */
    
    /* Guide Container - Mint */
    .qs-theme-glass.qs-guide {
      background: #eaece7 !important; 
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
      border: none !important;
    }

    /* 
       Glass Theme - MINT BUTTONS
       Targets: "Visible Area" (Left) and "Full Page" (Right)
    */
    .qs-theme-glass .qs-segmented .qs-guide-btn:first-child,
    .qs-theme-glass .qs-guide-buttons > .qs-guide-btn:not(.qs-theme-toggle) {
      background: #f2f4ef !important;
      border: 2px solid #f2f4ef !important;
      color: #282b30 !important;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18), 0 1px 4px rgba(0, 0, 0, 0.10) !important;
      opacity: 1;
    }

    /* Hover States - MINT BUTTONS → Invert to Dark */
    .qs-theme-glass .qs-segmented .qs-guide-btn:first-child:hover,
    .qs-theme-glass .qs-guide-buttons > .qs-guide-btn:not(.qs-theme-toggle):hover {
      background: #282b30 !important;
      color: #ffffff !important;
      border-color: #282b30 !important;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18), 0 1px 4px rgba(0, 0, 0, 0.10) !important;
    }
    .qs-theme-glass .qs-segmented .qs-guide-btn:first-child:hover svg,
    .qs-theme-glass .qs-guide-buttons > .qs-guide-btn:not(.qs-theme-toggle):hover svg {
      fill: #ffffff !important;
    }

    /* 
       Glass Theme - DARK BUTTON (Download/Middle)
    */
    .qs-theme-glass .qs-segmented .qs-guide-btn:last-child {
      background: #282b30 !important;
      border: 2px solid #282b30 !important;
      color: #ffffff !important;
      box-shadow: none !important;
      opacity: 1;
    }
    
    /* Hover State - DARK BUTTON → Invert to Mint */
    .qs-theme-glass .qs-segmented .qs-guide-btn:last-child:hover {
      background: #f2f4ef !important;
      color: #282b30 !important;
      border-color: #f2f4ef !important;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18), 0 1px 4px rgba(0, 0, 0, 0.10) !important;
    }
    .qs-theme-glass .qs-segmented .qs-guide-btn:last-child:hover svg {
      fill: #282b30 !important;
    }
    
    /* Ensure Download Icon is White */
    .qs-theme-glass .qs-segmented .qs-guide-btn:last-child svg {
      fill: #ffffff !important;
    }

    /* Ensure Other Icons are Dark */
    .qs-theme-glass .qs-segmented .qs-guide-btn:first-child svg,
    .qs-theme-glass .qs-guide-buttons > .qs-guide-btn:not(.qs-theme-toggle) svg {
      fill: #282b30 !important;
    }
    
    /* Active States */
    .qs-theme-glass .qs-guide-btn:active {
      transform: scale(0.96) !important;
    }

    /* Theme Toggle Visibility */
    .qs-theme-glass .qs-icon-sun { display: block !important; }
    .qs-theme-glass .qs-icon-moon { display: none !important; }

    /* Theme Toggle Color */
    .qs-theme-glass .qs-guide-buttons > .qs-theme-toggle {
      color: #282b30 !important;
    }

    /* Tooltip */
    .qs-theme-glass .qs-guide-btn::before {
       background: rgba(40, 43, 48, 0.9); 
       color: white;
    }

    /* --- Glass Toast / Status --- */
    .qs-theme-glass.qs-status {
      background: #eaece7 !important;
      color: #282b30 !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
      border: none !important;
      --qs-icon-fill: #282b30;
      --qs-icon-stroke: #f2f4ef;
    }
    .qs-theme-glass .qs-status-icon,
    .qs-theme-glass.qs-status .qs-status-icon {
      background: transparent !important;
      color: #282b30 !important;
    }
    .qs-theme-glass .qs-save-btn,
    .qs-theme-glass.qs-status .qs-save-btn {
      background: #282b30 !important;
      color: #ffffff !important;
      border: 2px solid transparent !important;
    }
    .qs-theme-glass .qs-save-btn:hover,
    .qs-theme-glass.qs-status .qs-save-btn:hover {
      background: #f2f4ef !important;
      color: #282b30 !important;
      border: 2px solid #282b30 !important;
    }


    /* =========================================
       5. ANIMATIONS & EXTRAS
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
  `,
  };
}
