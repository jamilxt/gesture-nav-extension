// Two-Finger Gesture Navigation - Content Script
// Depends on constants.js (loaded before this script via manifest)

(function() {
  'use strict';

  let settings = validateSettings(DEFAULT_SETTINGS);
  let wheelTimeout = null;
  let accumulatedDeltaX = 0;
  let lastGestureTime = 0;
  let indicator = null;
  let indicatorTimeout = null;

  // Load settings from storage with validation
  function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(DEFAULT_SETTINGS, (result) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to load settings:', chrome.runtime.lastError.message);
          return;
        }
        settings = validateSettings(result);
      });
    }
  }

  // Listen for settings changes
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        const updated = { ...settings };
        for (const key in changes) {
          if (key in updated) {
            updated[key] = changes[key].newValue;
          }
        }
        const wasEnabled = settings.enabled;
        settings = validateSettings(updated);

        // Reset accumulated delta when disabled to prevent ghost navigations
        if (wasEnabled && !settings.enabled) {
          accumulatedDeltaX = 0;
          clearTimeout(wheelTimeout);
          wheelTimeout = null;
        }
      }
    });
  }

  // Create visual indicator with direction
  function createIndicator(action) {
    if (!settings.showIndicator) return;

    removeIndicator();

    const offset = 100;
    const margin = 80;
    let xPos, yPos;
    const position = settings.indicatorPosition || 'sides';

    if (position === 'center') {
      xPos = '50%';
      yPos = '50%';
    } else if (position === 'left') {
      xPos = '20%';
      yPos = '50%';
    } else if (position === 'right') {
      xPos = '80%';
      yPos = '50%';
    } else if (position === 'top-left') {
      xPos = margin + 'px';
      yPos = margin + 'px';
    } else if (position === 'top-right') {
      xPos = `calc(100% - ${margin}px)`;
      yPos = margin + 'px';
    } else if (position === 'bottom-left') {
      xPos = margin + 'px';
      yPos = `calc(100% - ${margin}px)`;
    } else if (position === 'bottom-right') {
      xPos = `calc(100% - ${margin}px)`;
      yPos = `calc(100% - ${margin}px)`;
    } else {
      // 'sides' - default behavior
      xPos = action === 'back' ? `calc(50% - ${offset}px)` : `calc(50% + ${offset}px)`;
      yPos = '50%';
    }

    const arrowRotation = action === 'forward' ? 'rotate(0deg)' : 'rotate(180deg)';
    const labelText = action === 'back' ? 'BACK' : 'FORWARD';

    indicator = document.createElement('div');
    indicator.id = 'gesture-nav-indicator';
    indicator.style.cssText = `
      position: fixed !important;
      top: ${yPos} !important;
      left: ${xPos} !important;
      transform: translate(-50%, -50%) !important;
      width: ${settings.indicatorSize}px !important;
      height: ${settings.indicatorSize}px !important;
      background: ${settings.indicatorColor} !important;
      border-radius: 50% !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      opacity: 0.8 !important;
      transition: opacity 0.2s ease-out !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      gap: 4px !important;
    `;

    const arrow = document.createElement('div');
    arrow.style.cssText = `
      width: 0 !important;
      height: 0 !important;
      border-top: 12px solid transparent !important;
      border-bottom: 12px solid transparent !important;
      border-right: 16px solid white !important;
      transform: ${arrowRotation} !important;
    `;
    content.appendChild(arrow);

    const label = document.createElement('div');
    label.style.cssText = `
      color: white !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      text-transform: uppercase !important;
      letter-spacing: 1px !important;
    `;
    label.textContent = labelText;
    content.appendChild(label);

    indicator.appendChild(content);
    document.documentElement.appendChild(indicator);

    clearTimeout(indicatorTimeout);
    indicatorTimeout = setTimeout(removeIndicator, 600);
  }

  function removeIndicator() {
    if (indicator && indicator.parentNode) {
      indicator.style.opacity = '0';
      setTimeout(() => {
        if (indicator && indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
        indicator = null;
      }, 300);
    }
  }

  // Navigate via background service worker for reliable cross-origin navigation
  function navigate(action) {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'gesture', action: action }, () => {
        // Ignore response errors (e.g. if extension context invalidated)
        if (chrome.runtime.lastError) { /* noop */ }
      });
    }
  }

  // Handle wheel event for gesture detection
  function handleWheel(e) {
    if (!settings.enabled) return;

    // Skip if in editable elements
    const target = e.target;
    if (target && (
      target.tagName === 'TEXTAREA' ||
      (target.tagName === 'INPUT' && (target.type === 'text' || target.type === 'search' || target.type === 'url' || target.type === 'email')) ||
      target.isContentEditable ||
      target.closest('[contenteditable="true"]')
    )) {
      return;
    }

    // Detect horizontal scroll (two-finger swipe)
    if (e.deltaX !== 0) {
      clearTimeout(wheelTimeout);
      accumulatedDeltaX += e.deltaX;

      wheelTimeout = setTimeout(() => {
        const now = Date.now();
        const timeSinceLastGesture = now - lastGestureTime;

        // Check cooldown
        if (timeSinceLastGesture < settings.cooldown) {
          accumulatedDeltaX = 0;
          return;
        }

        // Check if threshold met
        if (Math.abs(accumulatedDeltaX) >= settings.sensitivity) {
          const swipeDirection = accumulatedDeltaX > 0 ? 'right' : 'left';
          let actionDirection = swipeDirection;

          if (settings.reverseDirection) {
            actionDirection = swipeDirection === 'right' ? 'left' : 'right';
          }

          const action = actionDirection === 'right' ? 'back' : 'forward';

          createIndicator(action);
          navigate(action);
          lastGestureTime = now;
        }

        accumulatedDeltaX = 0;
      }, 150);
    }
  }

  // Initialize
  loadSettings();
  document.addEventListener('wheel', handleWheel, { passive: true });

  // Re-load settings when page becomes visible
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadSettings();
    }
  });

})();
