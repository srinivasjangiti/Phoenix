// Phoenix Desktop Shell — Splash / Startup Controller

const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const statusText = document.getElementById('status-text');
const errorTitle = document.getElementById('error-title');
const errorDesc = document.getElementById('error-desc');
const logOutput = document.getElementById('log-output');
const retryBtn = document.getElementById('retry-btn');
const browserBtn = document.getElementById('browser-btn');

const PHOENIX_DEFAULT_PORT = 7777;

// Determine Tauri APIs
const isTauri = typeof window.__TAURI__ !== 'undefined' || typeof window.__TAURI_INTERNALS__ !== 'undefined';
const invoke = window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke;
const listen = window.__TAURI__?.event?.listen;

let transitioned = false;

function updateUI(status) {
  if (!status || transitioned) return;

  const state = status.state;
  const port = status.port || PHOENIX_DEFAULT_PORT;
  const dashboardUrl = `http://127.0.0.1:${port}/v2/`;

  if (state === 'READY') {
    transitioned = true;
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    statusText.textContent = 'Phoenix is ready. Opening...';

    // Transition immediately to dashboard
    setTimeout(() => {
      window.location.replace(dashboardUrl);
    }, 200);
    return;
  }

  if (state === 'STARTING' || state === 'STARTING_BACKEND') {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    statusText.textContent = status.message || 'Starting Phoenix engine...';
    return;
  }

  if (state === 'CHECKING') {
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    statusText.textContent = status.message || 'Connecting to local service...';
    return;
  }

  // Failure states: BACKEND_START_FAILED, BACKEND_CRASHED, BACKEND_UNRESPONSIVE, etc.
  loadingState.classList.add('hidden');
  errorState.classList.remove('hidden');

  if (state === 'BACKEND_CRASHED') {
    errorTitle.textContent = 'Phoenix stopped unexpectedly';
    errorDesc.textContent = 'The background service exited. Click below to restart.';
  } else if (state === 'BACKEND_START_FAILED') {
    errorTitle.textContent = "Phoenix couldn't start";
    errorDesc.textContent = status.message || 'Unable to start the background engine.';
  } else if (state === 'BACKEND_UNRESPONSIVE') {
    errorTitle.textContent = 'Startup timed out';
    errorDesc.textContent = 'Phoenix is taking longer than usual to start up.';
  } else {
    errorTitle.textContent = 'Notice';
    errorDesc.textContent = status.message || 'Unable to connect to Phoenix.';
  }

  if (status.recent_logs && status.recent_logs.length > 0) {
    logOutput.textContent = status.recent_logs.slice(-60).join('\n');
  } else {
    logOutput.textContent = 'No diagnostic logs available.';
  }
}

// Wire buttons
if (retryBtn) {
  retryBtn.addEventListener('click', async () => {
    transitioned = false;
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');
    statusText.textContent = 'Restarting Phoenix...';

    if (invoke) {
      try {
        await invoke('restart_backend');
      } catch (err) {
        console.error('Failed to restart backend:', err);
      }
    }
    setTimeout(checkHealthDirectly, 1000);
  });
}

if (browserBtn) {
  browserBtn.addEventListener('click', () => {
    window.open(`http://127.0.0.1:${PHOENIX_DEFAULT_PORT}/v2/`, '_blank');
  });
}

// Direct HTTP health polling fallback
let pollAttempts = 0;
async function checkHealthDirectly() {
  if (transitioned) return;
  pollAttempts++;

  try {
    const res = await fetch(`http://127.0.0.1:${PHOENIX_DEFAULT_PORT}/health`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.ok && (data.craftHealthy === true || data.carrier === true)) {
        updateUI({ state: 'READY', port: PHOENIX_DEFAULT_PORT, message: 'Ready' });
        return;
      } else if (data.ok) {
        statusText.textContent = 'Initializing subsystems...';
      }
    }
  } catch (e) {
    // Service not up yet
    if (pollAttempts > 2) {
      statusText.textContent = 'Starting Phoenix background service...';
    }
  }

  // Timeout warning after 30s
  if (pollAttempts > 35) {
    updateUI({
      state: 'BACKEND_UNRESPONSIVE',
      port: PHOENIX_DEFAULT_PORT,
      message: 'Service startup is taking longer than expected.',
      recent_logs: []
    });
    return;
  }

  setTimeout(checkHealthDirectly, 800);
}

// Initialize
async function init() {
  console.log('[Splash] Initializing Phoenix startup controller (isTauri:', isTauri, ')');

  // Start HTTP health poll immediately as primary or parallel fail-safe
  checkHealthDirectly();

  if (isTauri && invoke) {
    try {
      // Listen for supervisor state changes
      if (listen) {
        await listen('backend-state-changed', (event) => {
          console.log('[Splash] backend-state-changed received:', event.payload);
          updateUI(event.payload);
        });
      }

      // Fetch initial status
      const initialStatus = await invoke('get_backend_status');
      console.log('[Splash] get_backend_status:', initialStatus);
      updateUI(initialStatus);
    } catch (err) {
      console.warn('[Splash] Tauri IPC init note:', err);
    }
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
