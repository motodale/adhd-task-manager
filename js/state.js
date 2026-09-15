// State Management Module

const PRESETS = {
  decisions: [
    { label: '👍 Yes', weight: 1, color: '#10b981' },
    { label: '👎 No', weight: 1, color: '#ef4444' },
    { label: '🤷 Maybe', weight: 1, color: '#f59e0b' },
    { label: '🔄 Spin Again', weight: 1, color: '#6366f1' }
  ],
  numbers: [
    { label: '1', weight: 1 },
    { label: '2', weight: 1 },
    { label: '3', weight: 1 },
    { label: '4', weight: 1 },
    { label: '5', weight: 1 }
  ],
  daily: [
    { label: '🥤Drink Water', weight: 1 },
    { label: '🤸 Stretch', weight: 1 },
    { label: '☕ Caffinate', weight: 1 },
    { label: '📧 Check Emails', weight: 1 },
    { label: '📅 Reminders', weight: 1 }
  ],
  whisky: [
    { label: '🥃 Laphroaig 10', weight: 1 },
    { label: '🥃 Lagavulin 16', weight: 1 },
    { label: '🥃 Ardbeg Ten', weight: 1 },
    { label: '🥃 Bowmore 12', weight: 1 },
    { label: '🥃 Talisker 10', weight: 1 },
    { label: '🥃 Bruichladdich', weight: 1 },
    { label: '🌾 Peated Barley', weight: 1 },
    { label: '🔥 Peat Smoke', weight: 1 },
    { label: '🪵 Oak Sherry Cask', weight: 1 },
    { label: '🌊 Islay Sea Spray', weight: 1 },
    { label: '💧 Spring Water', weight: 1 },
    { label: '🥃 Caol Ila 12', weight: 1 }
  ]
};

// id -> display name. Islay is reachable only via the easter egg, never the toggle.
const THEMES = {
  cyberpunk: 'Cyberpunk',
  sunset: 'Sunset Glow',
  pastel: 'Pastel Dream',
  matrix: 'Matrix Green',
  cozy: 'Cozy Espresso',
  'cottage-core': 'Cottage Core',
  'goblin-core': 'Goblin Core',
  islay: 'Islay Highlands'
};

const THEME_CYCLE = Object.keys(THEMES).filter(id => id !== 'islay');

const THEME_PALETTES = {
  cyberpunk: ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#fbbf24', '#f472b6', '#22d3ee', '#818cf8', '#a3e635', '#ff5722', '#06b6d4', '#7c3aed'],
  sunset: ['#f97316', '#ef4444', '#f59e0b', '#dc2626', '#b45309', '#f43f5e', '#ea580c', '#f472b6', '#db2777', '#c2410c', '#e11d48', '#d97706'],
  pastel: ['#bfdbfe', '#fbcfe8', '#a7f3d0', '#fef3c7', '#c7d2fe', '#fde2e4', '#e2ece9', '#dfe7fd', '#ffedd5', '#f3e8ff', '#ecfdf5', '#fff7ed'],
  matrix: ['#22c55e', '#15803d', '#4ade80', '#0f766e', '#166534', '#10b981', '#14532d', '#115e59', '#34d399', '#059669', '#0284c7', '#0d9488'],
  cozy: ['#b45309', '#78350f', '#d97706', '#f59e0b', '#ae5f1a', '#854d0e', '#ca8a04', '#653b15', '#a16207', '#451a03', '#eddcc6', '#8c6239'],
  'cottage-core': ['#8C4335', '#A67C52', '#6b382e', '#c19669', '#A65b4c', '#8a6543', '#e4b680', '#633e38', '#9e5a48', '#8b7355', '#4a5d23', '#bd936a'],
  'goblin-core': ['#607C3C', '#8B4513', '#7A8B7B', '#A0522D', '#556B2F', '#CD853F', '#8FBC8F', '#6c5c4c', '#d34e36', '#9c5b3c', '#5b6f3a', '#a1a891'],
  islay: ['#D97706', '#8B4513', '#2e3b26', '#4a5e3a', '#8B7355', '#a0522d', '#854d0e', '#7a8b7b', '#b45309', '#5b6f3a', '#c2410c', '#3d2516']
};

const STORAGE_KEY = 'spinwheel';
const SAVED_FIELDS = ['segments', 'history', 'spinDuration', 'volume', 'wheelSize', 'theme', 'removeWinnerOnLand'];

// Reads the seven pre-consolidation spinwheel_* keys so existing visitors keep
// their wheel. Safe to delete once everyone has loaded the site once.
function readLegacyStorage() {
  const get = k => localStorage.getItem('spinwheel_' + k);
  if (!get('segments')) return null;
  const num = (k, fallback) => (get(k) === null ? fallback : parseFloat(get(k)));
  return {
    segments: JSON.parse(get('segments')),
    history: JSON.parse(get('history') || '[]'),
    spinDuration: num('duration', 5),
    volume: num('volume', 0.7),
    wheelSize: num('size', 480),
    theme: get('theme') || 'cyberpunk',
    removeWinnerOnLand: get('remove_winner') === 'true'
  };
}

class StateManager {
  constructor() {
    this.segments = [];
    this.history = [];
    this.spinDuration = 5; // seconds
    this.volume = 0.7; // 0 to 1
    this.wheelSize = 480; // default size in pixels
    this.theme = 'cyberpunk';
    this.removeWinnerOnLand = false;
    this.isSpinning = false;
    this.onChange = null;

    this.loadFromStorage();
  }

  notify() {
    this.saveToStorage();
    if (this.onChange) this.onChange(this);
  }

  loadFromStorage() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || readLegacyStorage();
    } catch (e) {
      console.error('Failed to load local storage state:', e);
    }

    if (saved) {
      for (const field of SAVED_FIELDS) {
        if (saved[field] !== undefined && saved[field] !== null) this[field] = saved[field];
      }
    }

    // Stored segments can be stale or hand-edited, so backfill anything missing.
    this.segments = this.segments.map(s => ({
      id: s.id || crypto.randomUUID(),
      label: s.label || 'Task',
      weight: Math.max(1, parseInt(s.weight, 10) || 1),
      color: s.color || '#8b5cf6'
    }));

    if (this.segments.length === 0) this.segments = this.segmentsFrom('decisions');
  }

  saveToStorage() {
    // Islay is a temporary costume: persist whatever was underneath it.
    const source = this.theme === 'islay'
      ? { ...this, theme: this.previousTheme || 'cyberpunk', segments: this.previousSegments || this.segments }
      : this;
    const blob = {};
    for (const field of SAVED_FIELDS) blob[field] = source[field];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  }

  // Build a fresh segment list from a preset. A preset may pin its own colours
  // (yes/no/maybe); otherwise segments take the active theme's palette.
  segmentsFrom(presetName) {
    const palette = THEME_PALETTES[this.theme] || THEME_PALETTES.cyberpunk;
    return PRESETS[presetName].map((seg, idx) => ({
      ...seg,
      id: crypto.randomUUID(),
      color: seg.color || palette[idx % palette.length]
    }));
  }

  setRemoveWinner(val) {
    this.removeWinnerOnLand = !!val;
    this.notify();
  }

  setWheelSize(val) {
    this.wheelSize = parseInt(val, 10);
    this.notify();
  }

  addSegment(label, weight = 1) {
    if (this.isSpinning) return;
    const palette = THEME_PALETTES[this.theme] || THEME_PALETTES.cyberpunk;
    this.segments.push({
      id: crypto.randomUUID(),
      label: label.trim(),
      weight: Math.max(1, parseInt(weight, 10) || 1),
      color: palette[this.segments.length % palette.length]
    });
    this.notify();
  }

  removeSegment(id) {
    if (this.isSpinning) return;
    this.segments = this.segments.filter(seg => seg.id !== id);
    if (this.segments.length === 0) this.segments = this.defaultSegment();
    this.notify();
  }

  clearAllSegments() {
    if (this.isSpinning) return;
    this.segments = this.defaultSegment();
    this.notify();
  }

  defaultSegment() {
    const palette = THEME_PALETTES[this.theme] || THEME_PALETTES.cyberpunk;
    return [{ id: crypto.randomUUID(), label: '✨ Task A', weight: 1, color: palette[0] }];
  }

  updateSegmentWeight(id, weight) {
    if (this.isSpinning) return;
    const seg = this.segments.find(s => s.id === id);
    if (seg) {
      seg.weight = Math.max(1, Math.min(100, parseInt(weight, 10) || 1));
      this.notify();
    }
  }

  updateSegmentColor(id, color) {
    if (this.isSpinning) return;
    const seg = this.segments.find(s => s.id === id);
    if (seg) {
      seg.color = color;
      this.notify();
    }
  }

  loadPreset(presetName) {
    if (this.isSpinning || !PRESETS[presetName]) return;
    this.segments = this.segmentsFrom(presetName);
    this.notify();
  }

  setSpinDuration(duration) {
    this.spinDuration = Math.max(2, Math.min(10, duration));
    this.notify();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.notify();
  }

  toggleTheme() {
    const nextIdx = (THEME_CYCLE.indexOf(this.theme) + 1) % THEME_CYCLE.length;
    this.setTheme(THEME_CYCLE[nextIdx]);
    // Smoothly apply theme-matched colors to all items
    this.applyThemePalette();
    this.notify();
  }

  setTheme(id) {
    this.theme = id;
    document.body.setAttribute('data-theme', id);
  }

  activateIslayEasterEgg() {
    if (this.isSpinning) return;

    if (this.theme === 'islay') {
      // Toggle OFF: restore the theme and segment list we stashed on the way in
      this.setTheme(this.previousTheme || 'cyberpunk');
      this.segments = this.previousSegments && this.previousSegments.length
        ? [...this.previousSegments]
        : this.segmentsFrom('decisions');
      this.applyThemePalette();
    } else {
      // Toggle ON: stash the current theme and segments
      this.previousTheme = this.theme;
      this.previousSegments = [...this.segments];

      this.setTheme('islay');
      this.segments = this.segmentsFrom('whisky');

      window.audioSynth.playChime();
    }

    this.notify();
  }

  applyThemePalette() {
    const palette = THEME_PALETTES[this.theme] || THEME_PALETTES.cyberpunk;
    this.segments.forEach((seg, idx) => {
      seg.color = palette[idx % palette.length];
    });
  }

  addHistory(label, color) {
    this.history.unshift({
      id: crypto.randomUUID(),
      label,
      color,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    if (this.history.length > 10) this.history.pop();
    this.notify();
  }

  clearHistory() {
    this.history = [];
    this.notify();
  }

  setSpinning(spinning) {
    this.isSpinning = spinning;
    this.notify();
  }
}

// Attach globally
window.state = new StateManager();
