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
  const wheel = new WheelController('wheelCanvas', state, (winner) => {
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

  // Subscribe to State modifications to automatically refresh the view
  state.subscribe((currentState) => {
    wheel.draw();
    renderSegmentList(currentState.segments);
    renderHistoryList(currentState.history);

    const themeName = currentState.getThemeDetails().name;
    themeTogglerBtn.querySelector('span').textContent = `Theme: ${themeName}`;

    if (currentState.isSpinning) {
      spinBtn.disabled = true;
      spinBtn.textContent = '🎰';
      toggleControls(true);
    } else {
      spinBtn.disabled = false;
      spinBtn.textContent = 'Spin';
      toggleControls(false);
    }
  });

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
          <i data-lucide="trash-2" style="width: 1.15rem; height: 1.15rem;"></i>
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

    lucide.createIcons();
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

  // Toggle user editing elements during the spin
  function toggleControls(disable) {
    const inputs = document.querySelectorAll('.segment-item input, .segment-item button, #newItemLabel, #newItemWeight, #newItemMultiplier, #addSegmentForm button, .preset-btn, #themeTogglerBtn, #clearItemsBtn, #removeWinnerToggle');
    inputs.forEach(el => {
      if (disable) {
        el.setAttribute('disabled', 'true');
        el.style.opacity = '0.5';
        el.style.pointerEvents = 'none';
      } else {
        el.removeAttribute('disabled');
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
      }
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
  spinBtn.addEventListener('click', () => {
    audioSynth.init();
    wheel.spin();
  });

  // Keyboard shortcut: Spacebar to spin
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && !state.isSpinning) {
      e.preventDefault();
      audioSynth.init();
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
