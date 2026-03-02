/**
 * Claude Usage Tracker — Popup Script
 *
 * Reads counts from chrome.storage.local and renders the UI.
 * Handles the reset button.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cut_data';

// Widely-reported Claude Pro limit: ~45 messages per 5-hour window
const TYPICAL_LIMIT = 45;

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const elLoading      = document.getElementById('loadingState');
const elStatsContent = document.getElementById('statsContent');
const elCountToday   = document.getElementById('countToday');
const elCountWeek    = document.getElementById('countWeek');
const elCountSession = document.getElementById('countSession');
const elProgressFill = document.getElementById('progressFill');
const elProgressPct  = document.getElementById('progressPct');
const elRateBanner   = document.getElementById('rateLimitBanner');
const elBtnReset     = document.getElementById('btnReset');

// ─── Render ───────────────────────────────────────────────────────────────────

function render(data) {
  const today   = data.countToday   || 0;
  const week    = data.countWeek    || 0;
  const session = data.countSession || 0;

  elCountToday.innerHTML = `${today} <span class="stat-limit">/ ~${TYPICAL_LIMIT}</span>`;
  elCountWeek.textContent   = week;
  elCountSession.textContent = session;

  const pct = Math.min(100, Math.round((today / TYPICAL_LIMIT) * 100));
  elProgressFill.style.width = pct + '%';
  elProgressPct.textContent  = pct + '%';

  // Color thresholds
  elProgressFill.classList.remove('warn', 'danger');
  if (pct >= 95) {
    elProgressFill.classList.add('danger');
  } else if (pct >= 80) {
    elProgressFill.classList.add('warn');
  }

  // Rate limit banner
  if (data.rateLimitHit) {
    elRateBanner.classList.add('visible');
  } else {
    elRateBanner.classList.remove('visible');
  }

  elLoading.style.display      = 'none';
  elStatsContent.style.display = 'block';
}

// ─── Load data ─────────────────────────────────────────────────────────────────

function loadAndRender() {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const data = result[STORAGE_KEY] || {
      countToday: 0,
      countWeek: 0,
      countSession: 0,
      rateLimitHit: false,
    };

    // Handle day rollover: if stored date != today, treat counts as zero
    const today = new Date().toISOString().slice(0, 10);
    if (data.today && data.today !== today) {
      data.countToday = 0;
      data.countSession = 0;
      data.rateLimitHit = false;
    }

    render(data);
  });
}

// ─── Reset button ─────────────────────────────────────────────────────────────

elBtnReset.addEventListener('click', () => {
  const today = new Date().toISOString().slice(0, 10);
  const fresh = {
    today,
    weekStart: getWeekStart(),
    countToday: 0,
    countWeek: 0,
    countSession: 0,
    rateLimitHit: false,
    rateLimitAt: null,
    lastUpdated: new Date().toISOString(),
  };

  chrome.storage.local.set({ [STORAGE_KEY]: fresh }, () => {
    // Also clear badge
    chrome.action.setBadgeText({ text: '' });
    render(fresh);
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekStart() {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

loadAndRender();
