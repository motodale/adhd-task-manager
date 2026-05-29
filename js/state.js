// State Management Module

const PRESETS = {
  decisions: [
    { label: '👍 Yes', weight: 1, color: '#10b981' },
    { label: '👎 No', weight: 1, color: '#ef4444' },
    { label: '🤷 Maybe', weight: 1, color: '#f59e0b' },
    { label: '🔄 Spin Again', weight: 1, color: '#6366f1' }
  ],
  numbers: [
    { label: '1', weight: 1, color: '#f87171' },
    { label: '2', weight: 1, color: '#fbbf24' },
    { label: '3', weight: 1, color: '#34d399' },
    { label: '4', weight: 1, color: '#22d3ee' },
    { label: '5', weight: 1, color: '#60a5fa' }
  ],
  daily: [
    { label: '🥤Drink Water', weight: 1, color: '#3b82f6' },
    { label: '🤸 Stretch', weight: 1, color: '#10b981' },
    { label: '☕ Caffinate', weight: 1, color: '#f59e0b' },
    { label: '📧 Check Emails', weight: 1, color: '#8b5cf6' },
    { label: '📅 Reminders', weight: 1, color: '#22d3ee' }
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

const THEMES = [
  { id: 'cyberpunk', name: 'Cyberpunk', bg: '#0a0b10' },
  { id: 'sunset', name: 'Sunset Glow', bg: '#0f0a0a' },
  { id: 'pastel', name: 'Pastel Dream', bg: '#0b0f19' },
  { id: 'matrix', name: 'Matrix Green', bg: '#050805' },
  { id: 'cozy', name: 'Cozy Espresso', bg: '#2a2421' },
  { id: 'cottage-core', name: 'Cottage Core', bg: '#1c1917' },
  { id: 'goblin-core', name: 'Goblin Core', bg: '#161412' }
];

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

class StateManager {
  constructor() {
    this.segments = [];
    this.history = [];
    this.spinDuration = 5; // seconds
    this.volume = 0.7; // 0 to 1
    this.theme = 'cyberpunk';
    this.removeWinnerOnLand = false;
    this.isSpinning = false;
    this.listeners = [];

    this.loadFromStorage();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this);
  }

  notify() {
    this.listeners.forEach(callback => callback(this));
  }

  loadFromStorage() {
    try {
      const storedSegments = localStorage.getItem('spinwheel_segments');
      const storedHistory = localStorage.getItem('spinwheel_history');
      const storedDuration = localStorage.getItem('spinwheel_duration');
      const storedVolume = localStorage.getItem('spinwheel_volume');
      const storedTheme = localStorage.getItem('spinwheel_theme');
      const storedRemoveWinner = localStorage.getItem('spinwheel_remove_winner');

      if (storedSegments) {
        const rawSegs = JSON.parse(storedSegments);
        this.segments = rawSegs.map(s => ({
          id: s.id || 'seg_' + Math.random().toString(36).substr(2, 4),
          label: s.label || 'Task',
          weight: Math.max(1, parseInt(s.weight, 10) || 1),
          color: s.color || '#8b5cf6'
        }));
      } else {
        this.segments = [...PRESETS.decisions];
      }

      if (storedHistory) {
        this.history = JSON.parse(storedHistory);
      }

      if (storedDuration) {
        this.spinDuration = parseInt(storedDuration, 10);
      }

      if (storedVolume) {
        this.volume = parseFloat(storedVolume);
      }

      if (storedTheme) {
        this.theme = storedTheme;
      }

      if (storedRemoveWinner) {
        this.removeWinnerOnLand = storedRemoveWinner === 'true';
      }
    } catch (e) {
      console.error('Failed to load local storage state:', e);
      this.segments = [...PRESETS.decisions];
    }
  }

  saveToStorage() {
    try {
      const themeToSave = this.theme === 'islay' ? (this.previousTheme || 'cyberpunk') : this.theme;
      const segmentsToSave = this.theme === 'islay' ? (this.previousSegments || this.segments) : this.segments;

      localStorage.setItem('spinwheel_segments', JSON.stringify(segmentsToSave));
      localStorage.setItem('spinwheel_history', JSON.stringify(this.history));
      localStorage.setItem('spinwheel_duration', this.spinDuration.toString());
      localStorage.setItem('spinwheel_volume', this.volume.toString());
      localStorage.setItem('spinwheel_theme', themeToSave);
      localStorage.setItem('spinwheel_remove_winner', this.removeWinnerOnLand.toString());
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  }

  setRemoveWinner(val) {
    this.removeWinnerOnLand = !!val;
    this.saveToStorage();
    this.notify();
  }

  addSegment(label, weight = 1) {
    if (this.isSpinning) return;
    const palette = THEME_PALETTES[this.theme] || THEME_PALETTES.cyberpunk;
    const colorIndex = this.segments.length % palette.length;
    const parsedWeight = Math.max(1, parseInt(weight, 10) || 1);
    const newSeg = {
      id: 'seg_' + Date.now() + Math.random().toString(36).substr(2, 4),
      label: label.trim(),
      weight: parsedWeight,
      color: palette[colorIndex]
    };
    this.segments.push(newSeg);
    this.saveToStorage();
    this.notify();
  }

  removeSegment(id) {
    if (this.isSpinning) return;
    this.segments = this.segments.filter(seg => seg.id !== id);
    if (this.segments.length === 0) {
      const palette = THEME_PALETTES[this.theme] || THEME_PALETTES.cyberpunk;
      this.segments.push({
        id: 'seg_default',
        label: '✨ Task A',
        weight: 1,
        color: palette[0]
      });
    }
    this.saveToStorage();
    this.notify();
  }

  clearAllSegments() {
    if (this.isSpinning) return;
    const palette = THEME_PALETTES[this.theme] || THEME_PALETTES.cyberpunk;
    this.segments = [
      {
        id: 'seg_default',
        label: '✨ Task A',
        weight: 1,
        color: palette[0]
      }
    ];
    this.saveToStorage();
    this.notify();
  }

  updateSegmentWeight(id, weight) {
    if (this.isSpinning) return;
    const cleanWeight = Math.max(1, Math.min(100, parseInt(weight, 10) || 1));
    const seg = this.segments.find(s => s.id === id);
    if (seg) {
      seg.weight = cleanWeight;
      this.saveToStorage();
      this.notify();
    }
  }

  updateSegmentColor(id, color) {
    if (this.isSpinning) return;
    const seg = this.segments.find(s => s.id === id);
    if (seg) {
      seg.color = color;
      this.saveToStorage();
      this.notify();
    }
  }

  loadPreset(presetName) {
    if (this.isSpinning) return;
    if (PRESETS[presetName]) {
      const palette = THEME_PALETTES[this.theme] || THEME_PALETTES.cyberpunk;
      this.segments = PRESETS[presetName].map((seg, idx) => ({
        id: `seg_preset_${presetName}_${idx}_${Date.now()}`,
        ...seg,
        color: palette[idx % palette.length]
      }));
      this.saveToStorage();
      this.notify();
    }
  }

  setSpinDuration(duration) {
    this.spinDuration = Math.max(2, Math.min(10, duration));
    this.saveToStorage();
    this.notify();
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.saveToStorage();
    this.notify();
  }

  toggleTheme() {
    const currentIdx = THEMES.findIndex(t => t.id === this.theme);
    const nextIdx = (currentIdx + 1) % THEMES.length;
    this.theme = THEMES[nextIdx].id;
    document.body.setAttribute('data-theme', this.theme);
    
    // Smoothly apply theme-matched colors to all items
    this.applyThemePalette();
    
    this.saveToStorage();
    this.notify();
  }

  activateIslayEasterEgg() {
    if (this.isSpinning) return;
    
    if (this.theme === 'islay') {
      // Toggle OFF: Restore previous theme and segment list
      this.theme = this.previousTheme || 'cyberpunk';
      document.body.setAttribute('data-theme', this.theme);
      
      if (this.previousSegments && this.previousSegments.length > 0) {
        this.segments = [...this.previousSegments];
      } else {
        this.segments = [...PRESETS.decisions];
      }
      
      this.applyThemePalette();
    } else {
      // Toggle ON: Cache current theme and segments
      this.previousTheme = this.theme;
      this.previousSegments = [...this.segments];
      
      this.theme = 'islay';
      document.body.setAttribute('data-theme', 'islay');
      
      const palette = THEME_PALETTES.islay;
      this.segments = PRESETS.whisky.map((seg, idx) => ({
        id: `seg_whisky_${idx}_${Date.now()}`,
        ...seg,
        color: palette[idx % palette.length]
      }));
      
      window.audioSynth.init();
      window.audioSynth.playChime();
    }
    
    this.saveToStorage();
    this.notify();
  }

  applyThemePalette() {
    const palette = THEME_PALETTES[this.theme] || THEME_PALETTES.cyberpunk;
    this.segments.forEach((seg, idx) => {
      seg.color = palette[idx % palette.length];
    });
  }

  getThemeDetails() {
    if (this.theme === 'islay') {
      return { id: 'islay', name: 'Islay Highlands', bg: '#121511' };
    }
    return THEMES.find(t => t.id === this.theme) || THEMES[0];
  }

  addHistory(label, color) {
    const historyItem = {
      id: 'hist_' + Date.now(),
      label,
      color,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    this.history.unshift(historyItem);
    if (this.history.length > 10) {
      this.history.pop();
    }
    this.saveToStorage();
    this.notify();
  }

  clearHistory() {
    this.history = [];
    this.saveToStorage();
    this.notify();
  }

  setSpinning(spinning) {
    this.isSpinning = spinning;
    this.notify();
  }
}

// Attach globally
window.state = new StateManager();
