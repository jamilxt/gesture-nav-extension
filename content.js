// Two-Finger Gesture Navigation - Content Script

(function() {
  'use strict';

  // Default settings
  const DEFAULT_SETTINGS = {
    enabled: true,
    sensitivity: 100,      // Delta threshold to trigger gesture
    cooldown: 300,         // Cooldown between gestures in ms
    reverseDirection: true, // Reverse swipe direction (default)
    showIndicator: false,  // Show visual indicator (disabled by default)
    indicatorColor: '#4285f4',
    indicatorSize: 60,
    indicatorPosition: 'bottom-right' // 'sides', 'center', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  };

  let settings = { ...DEFAULT_SETTINGS };
  let wheelTimeout = null;
  let accumulatedDeltaX = 0;
  let lastGestureTime = 0;
  let indicator = null;
  let indicatorTimeout = null;

  // Load settings from storage
  function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(DEFAULT_SETTINGS, (result) => {
        settings = { ...DEFAULT_SETTINGS, ...result };
      });
    }
  }

  // Listen for settings changes
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local') {
        for (let key in changes) {
          if (key in settings) {
            settings[key] = changes[key].newValue;
          }
        }
      }
    });
  }

  // Create visual indicator with direction
  function createIndicator(action) {
    if (!settings.showIndicator) return;

    removeIndicator();

    const offset = 100; // pixels from center
    const margin = 80; // pixels from edge for corners
    let xPos, yPos;
    const position = settings.indicatorPosition || 'sides';

    // Calculate position based on action (what will happen)
    let positionForLayout = action;

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
      xPos = positionForLayout === 'back' ? `calc(50% - ${offset}px)` : `calc(50% + ${offset}px)`;
      yPos = '50%';
    }

    // Arrow shows the action direction (where you're going)
    // Default arrow points right (▶), so:
    // - BACK (◀) = rotate 180deg
    // - FORWARD (▶) = no rotation
    const arrowRotation = action === 'forward' ? 'rotate(0deg)' : 'rotate(180deg)';
    // Text shows what will happen
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

    // Add arrow and text
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

    // Auto-remove after timeout
    clearTimeout(indicatorTimeout);
    indicatorTimeout = setTimeout(removeIndicator, 600);
  }

  function updateIndicator(direction) {
    // No longer needed - everything handled in createIndicator
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

  // Handle wheel event for gesture detection
  function handleWheel(e) {
    // Skip if disabled
    if (!settings.enabled) return;

    // Skip if in editable elements (user might be scrolling)
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
      // Reset timeout
      clearTimeout(wheelTimeout);

      accumulatedDeltaX += e.deltaX;

      // Set timeout to detect end of gesture
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
          // Track the actual swipe direction before any reversal
          const swipeDirection = accumulatedDeltaX > 0 ? 'right' : 'left';
          let actionDirection = swipeDirection;

          // Reverse if setting enabled
          if (settings.reverseDirection) {
            actionDirection = swipeDirection === 'right' ? 'left' : 'right';
          }

          // Right swipe = back, Left swipe = forward
          // (Swipe right means moving content right, like going back in history)
          const action = actionDirection === 'right' ? 'back' : 'forward';

          // For the indicator, show what WILL happen
          createIndicator(action);

          // Navigate directly
          try {
            if (action === 'back') {
              window.history.back();
            } else if (action === 'forward') {
              window.history.forward();
            }
          } catch (err) {
            console.log('Navigation error:', err);
          }

          lastGestureTime = now;
        }

        accumulatedDeltaX = 0;
      }, 150); // Wait for gesture to complete
    }
  }

  // Initialize
  loadSettings();
  document.addEventListener('wheel', handleWheel, { passive: true });

  // Re-load settings when page becomes visible (in case settings changed)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadSettings();
    }
  });

})();
