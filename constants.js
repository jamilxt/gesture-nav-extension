// Two-Finger Gesture Navigation - Shared Constants

const DEFAULT_SETTINGS = {
  enabled: true,
  sensitivity: 100,      // Delta threshold to trigger gesture (30-300)
  cooldown: 300,         // Cooldown between gestures in ms (100-1000)
  reverseDirection: true, // Reverse swipe direction (default: true)
  showIndicator: false,  // Show visual indicator (default: false)
  indicatorColor: '#4285f4',
  indicatorSize: 60,     // Indicator size in px (30-120)
  indicatorPosition: 'bottom-right' // 'sides', 'center', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
};

// Validation bounds for numeric settings
const SETTINGS_BOUNDS = {
  sensitivity: { min: 30, max: 300 },
  cooldown: { min: 100, max: 1000 },
  indicatorSize: { min: 30, max: 120 }
};

// Valid indicator positions
const VALID_POSITIONS = ['sides', 'center', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];

/**
 * Validate and sanitize settings loaded from storage.
 * Returns a clean settings object with all values within valid bounds.
 */
function validateSettings(raw) {
  const settings = { ...DEFAULT_SETTINGS };

  // Boolean settings
  if (typeof raw.enabled === 'boolean') settings.enabled = raw.enabled;
  if (typeof raw.reverseDirection === 'boolean') settings.reverseDirection = raw.reverseDirection;
  if (typeof raw.showIndicator === 'boolean') settings.showIndicator = raw.showIndicator;

  // Numeric settings with bounds
  for (const [key, bounds] of Object.entries(SETTINGS_BOUNDS)) {
    const val = parseInt(raw[key], 10);
    if (!isNaN(val)) {
      settings[key] = Math.max(bounds.min, Math.min(bounds.max, val));
    }
  }

  // Color - basic hex validation
  if (typeof raw.indicatorColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.indicatorColor)) {
    settings.indicatorColor = raw.indicatorColor;
  }

  // Position - must be in valid list
  if (VALID_POSITIONS.includes(raw.indicatorPosition)) {
    settings.indicatorPosition = raw.indicatorPosition;
  }

  return settings;
}
