/**
 * Claude Usage Tracker — Content Script
 * Injected into claude.ai pages.
 *
 * Tracks message sends by intercepting fetch calls and watching DOM mutations.
 * Stores counts in chrome.storage.local. Detects rate limit UI text.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cut_data';

// Claude sends messages to this endpoint
const SEND_MESSAGE_PATTERN = '/chat_conversations/';
const SEND_MESSAGE_METHOD_HINT = 'POST';

// Text that appears in the UI when rate limited
const RATE_LIMIT_PHRASES = [
  "you've reached your limit",
  "you have reached your limit",
  "rate limit",
  "message limit",
  "too many messages",
  "usage limit",
  "try again in",
];

// ─── State ───────────────────────────────────────────────────────────────────

let rateLimitDetected = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().slice(0, 10); // "2026-03-02"
}

function thisWeekKey() {
  const d = new Date();
  const day = d.getDay() || 7; // make Monday = 1
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10); // Monday of current week
}

function loadData(cb) {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const defaults = {
      today: todayKey(),
      weekStart: thisWeekKey(),
      countToday: 0,
      countWeek: 0,
      countSession: 0,
      rateLimitHit: false,
      rateLimitAt: null,
      lastUpdated: null,
    };
    cb(Object.assign(defaults, result[STORAGE_KEY] || {}));
  });
}

function saveData(data) {
  data.lastUpdated = new Date().toISOString();
  chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
    if (chrome.runtime.lastError) {
      console.debug('[CUT] Storage error:', chrome.runtime.lastError.message);
    }
  });
}

function incrementCount() {
  loadData((data) => {
    const today = todayKey();
    const weekStart = thisWeekKey();

    // Roll over daily count if it's a new day
    if (data.today !== today) {
      data.today = today;
      data.countToday = 0;
    }

    // Roll over weekly count if it's a new week
    if (data.weekStart !== weekStart) {
      data.weekStart = weekStart;
      data.countWeek = 0;
    }

    data.countToday += 1;
    data.countWeek += 1;
    data.countSession += 1;

    saveData(data);
    notifyBackground(data);
  });
}

function notifyBackground(data) {
  chrome.runtime.sendMessage({ type: 'COUNT_UPDATE', data }).catch(() => {
    // Background may not be listening — safe to ignore
  });
}

// ─── Fetch Interception ──────────────────────────────────────────────────────

(function interceptFetch() {
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const req = args[0];
    const url = req instanceof Request ? req.url : String(req || '');
    const method = (req instanceof Request ? req.method : (args[1]?.method || 'GET')).toUpperCase();

    const response = await originalFetch.apply(this, args);

    // Detect message sends: POST to /chat_conversations/.../completion or similar
    if (
      method === SEND_MESSAGE_METHOD_HINT &&
      url.includes(SEND_MESSAGE_PATTERN) &&
      (url.includes('/completion') || url.includes('/messages'))
    ) {
      // Only count if response is OK (2xx)
      if (response.ok) {
        incrementCount();
      }
    }

    return response;
  };
})();

// ─── Rate Limit DOM Detection ─────────────────────────────────────────────────

function checkForRateLimitText(node) {
  const text = (node.textContent || '').toLowerCase();
  if (RATE_LIMIT_PHRASES.some((phrase) => text.includes(phrase))) {
    if (!rateLimitDetected) {
      rateLimitDetected = true;
      loadData((data) => {
        data.rateLimitHit = true;
        data.rateLimitAt = new Date().toISOString();
        saveData(data);
        notifyBackground(data);
      });
    }
  }
}

function observeRateLimitUI() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          checkForRateLimitText(node);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Also do an initial scan in case the page loaded already rate-limited
function initialRateLimitScan() {
  checkForRateLimitText(document.body);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  initialRateLimitScan();
  observeRateLimitUI();
  console.debug('[CUT] Claude Usage Tracker content script ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
