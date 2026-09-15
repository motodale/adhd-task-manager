// Main Entry Point & Orchestrator

document.addEventListener('DOMContentLoaded', () => {
  // DOM Cache
  const spinBtn = document.getElementById('spinBtn');
  const addSegmentForm = document.getElementById('addSegmentForm');
  const newItemLabel = document.getElementById('newItemLabel');
  const newItemWeight = document.getElementById('newItemWeight');
  const newItemMultiplier = document.getElementById('newItemMultiplier');
  const segmentListContainer = document.getElementById('segmentListContainer');
  const historyListContainer = document.getElementById('historyListContainer');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const clearItemsBtn = document.getElementById('clearItemsBtn');
  const themeTogglerBtn = document.getElementById('themeTogglerBtn');
  const spinDurationInput = document.getElementById('spinDurationInput');
  const durationVal = document.getElementById('durationVal');
  const volumeInput = document.getElementById('volumeInput');
  const volumeVal = document.getElementById('volumeVal');
  const removeWinnerToggle = document.getElementById('removeWinnerToggle');
  const wheelSizeInput = document.getElementById('wheelSizeInput');
  const wheelSizeVal = document.getElementById('wheelSizeVal');
  
  // Modal Elements
  const winnerModal = document.getElementById('winnerModal');
  const winnerName = document.getElementById('winnerName');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // Load from global state
  const state = window.state;
  const audioSynth = window.audioSynth;
  const confetti = window.confetti;
  const WheelController = window.WheelController;

  // Initialize Wheel controller
  const wheel = new WheelController(state, (winner) => {
    winnerName.textContent = winner.label;
    winnerName.style.borderBottom = `4px solid ${winner.color}`;
    
    winnerModal.classList.add('active');
    
    confetti.burst(window.innerWidth / 2, window.innerHeight * 0.4, 150);
    
    audioSynth.playChime();
    
    state.addHistory(winner.label, winner.color);

    // Auto-remove winning segment after delay if toggle is active
    if (state.removeWinnerOnLand) {
      setTimeout(() => {
        state.removeSegment(winner.id);
      }, 1500);
    }
  });

  // Apply default settings from loaded state
  document.body.setAttribute('data-theme', state.theme);
  spinDurationInput.value = state.spinDuration;
  durationVal.textContent = `${state.spinDuration}s`;
  volumeInput.value = state.volume * 100;
  volumeVal.textContent = `${Math.round(state.volume * 100)}%`;
  audioSynth.setVolume(state.volume);
  removeWinnerToggle.checked = state.removeWinnerOnLand;
  wheelSizeInput.value = state.wheelSize;
  wheelSizeVal.textContent = `${state.wheelSize}px`;

  // Re-render whenever state changes
  state.onChange = (currentState) => {
    wheel.initCanvas();
    wheel.draw();
    renderSegmentList(currentState.segments);
    renderHistoryList(currentState.history);

    themeTogglerBtn.querySelector('span').textContent = `Theme: ${THEMES[currentState.theme]}`;

    // Toggle Title and Brand Header for Islay Easter Egg
    const brandHeader = document.querySelector('.brand h1');
    if (currentState.theme === 'islay') {
      document.title = '🥃 SCOTCH TIME! 🥃';
      if (brandHeader) brandHeader.textContent = '🥃 SCOTCH TIME! 🥃';
    } else {
      document.title = 'The Task Wheel';
      if (brandHeader) brandHeader.textContent = 'The Task Wheel';
    }

    document.body.classList.toggle('spinning', currentState.isSpinning);
    spinBtn.disabled = currentState.isSpinning;
    spinBtn.textContent = currentState.isSpinning ? '🎰' : 'Spin';
  };
  state.onChange(state);

  // Render the segment list items editor
  function renderSegmentList(segments) {
    segmentListContainer.innerHTML = '';
    
    segments.forEach((seg) => {
      const item = document.createElement('div');
      item.className = 'segment-item';
      
      item.innerHTML = `
        <div class="color-picker-wrapper" style="background-color: ${seg.color}" title="Choose color">
          <input type="color" class="color-input" data-id="${seg.id}" value="${seg.color}">
        </div>
        <span style="font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${seg.label}">${seg.label}</span>
        <input type="number" class="weight-input" data-id="${seg.id}" min="1" max="100" value="${seg.weight}" title="Optional Weight">
        <button class="btn-icon-delete" data-id="${seg.id}" title="Remove Item">
          <svg class="icon" viewBox="0 0 24 24" style="width: 1.15rem; height: 1.15rem;"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      `;

      const picker = item.querySelector('.color-input');
      picker.addEventListener('input', (e) => {
        state.updateSegmentColor(seg.id, e.target.value);
      });

      const weightInput = item.querySelector('.weight-input');
      weightInput.addEventListener('change', (e) => {
        state.updateSegmentWeight(seg.id, e.target.value);
      });

      const deleteBtn = item.querySelector('.btn-icon-delete');
      deleteBtn.addEventListener('click', () => {
        state.removeSegment(seg.id);
      });

      segmentListContainer.appendChild(item);
    });
  }

  // Render spin history
  function renderHistoryList(history) {
    historyListContainer.innerHTML = '';
    
    if (history.length === 0) {
      historyListContainer.innerHTML = '<div class="history-empty">No spins logged yet. Hit Spin!</div>';
      return;
    }

    history.forEach((hist) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-val">
          <span class="history-dot" style="background-color: ${hist.color}"></span>
          <span>${hist.label}</span>
        </div>
        <span class="history-time">${hist.timestamp}</span>
      `;
      historyListContainer.appendChild(item);
    });
  }

  // EVENT BINDINGS
  
  // Submit segment form
  addSegmentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const labelVal = newItemLabel.value.trim();
    const weightVal = newItemWeight.value ? parseInt(newItemWeight.value, 10) : 1;
    const multVal = newItemMultiplier.value ? parseInt(newItemMultiplier.value, 10) : 1;
    
    if (labelVal) {
      if (multVal > 1) {
        for (let i = 1; i <= multVal; i++) {
          state.addSegment(`${labelVal} #${i}`, weightVal);
        }
      } else {
        state.addSegment(labelVal, weightVal);
      }
      newItemLabel.value = '';
      newItemWeight.value = '';
      newItemMultiplier.value = '';
    }
  });

  // Spin Button trigger
  spinBtn.addEventListener('click', () => wheel.spin());

  // Keyboard shortcut: Spacebar to spin
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && !state.isSpinning) {
      e.preventDefault();
      wheel.spin();
    }
  });

  // Modal Close trigger
  closeModalBtn.addEventListener('click', () => {
    winnerModal.classList.remove('active');
  });

  // Preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetName = btn.getAttribute('data-preset');
      state.loadPreset(presetName);
    });
  });

  // Theme selector toggler
  themeTogglerBtn.addEventListener('click', () => {
    state.toggleTheme();
  });

  // Config: Spin Duration slider
  spinDurationInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.setSpinDuration(val);
    durationVal.textContent = `${val}s`;
  });

  // Config: Volume slider
  volumeInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) / 100;
    state.setVolume(val);
    audioSynth.setVolume(val);
    volumeVal.textContent = `${Math.round(val * 100)}%`;
  });

  // Clear History
  clearHistoryBtn.addEventListener('click', () => {
    state.clearHistory();
  });

  // Clear All Wheel Items
  clearItemsBtn.addEventListener('click', () => {
    state.clearAllSegments();
  });

  // Toggle remove winner on land
  removeWinnerToggle.addEventListener('change', (e) => {
    state.setRemoveWinner(e.target.checked);
  });

  // Config: Wheel Size slider
  wheelSizeInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.setWheelSize(val);
    wheelSizeVal.textContent = `${val}px`;
  });

  // Easter Egg: Dale click event triggers premium Islay whisky theme
  const daleEasterEgg = document.getElementById('daleEasterEgg');
  if (daleEasterEgg) {
    daleEasterEgg.addEventListener('click', () => {
      state.activateIslayEasterEgg();
      // Burst celebratory confetti on secret unlock!
      confetti.burst(window.innerWidth / 2, window.innerHeight * 0.4, 200);
    });
  }
});
