/**
 * Claude Usage Tracker — Background Service Worker
 *
 * Responsibilities:
 * - Receive count updates from content script
 * - Update badge on extension icon
 * - Midnight reset of daily counts
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cut_data';

// ~45 messages per 5-hour window is the widely-reported Claude Pro limit
const TYPICAL_LIMIT = 45;

// ─── Badge Helpers ────────────────────────────────────────────────────────────

function updateBadge(countToday) {
  const label = countToday >= 1000 ? '999+' : String(countToday);

  let color = '#22c55e'; // green
  const pct = countToday / TYPICAL_LIMIT;
  if (pct >= 0.95) {
    color = '#ef4444'; // red
  } else if (pct >= 0.80) {
    color = '#f59e0b'; // amber
  }

  chrome.action.setBadgeText({ text: label });
  chrome.action.setBadgeBackgroundColor({ color });
}

function clearBadge() {
  chrome.action.setBadgeText({ text: '' });
}

// ─── Message Handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'COUNT_UPDATE') {
    updateBadge(message.data.countToday || 0);
    sendResponse({ ok: true });
  }
  return true; // keep channel open for async response
});

// ─── Midnight Reset (Alarm) ───────────────────────────────────────────────────

function scheduleMidnightReset() {
  // Clear any existing alarm first
  chrome.alarms.clear('midnight-reset', () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 5, 0); // 00:00:05 next day — just past midnight

    const delayMs = midnight.getTime() - now.getTime();
    const delayMinutes = delayMs / 60000;

    chrome.alarms.create('midnight-reset', {
      delayInMinutes: delayMinutes,
      periodInMinutes: 1440, // repeat daily
    });

    console.debug('[CUT] Midnight reset scheduled in', Math.round(delayMinutes), 'minutes');
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'midnight-reset') {
    performDailyReset();
  }
});

function performDailyReset() {
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const data = result[STORAGE_KEY] || {};
    const today = new Date().toISOString().slice(0, 10);

    data.today = today;
    data.countToday = 0;
    data.countSession = 0;
    data.rateLimitHit = false;
    data.rateLimitAt = null;
    data.lastUpdated = new Date().toISOString();

    chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
      clearBadge();
      console.debug('[CUT] Daily reset complete for', today);
    });
  });
}

// ─── Init on Install / Startup ────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  scheduleMidnightReset();
  clearBadge();
  console.debug('[CUT] Claude Usage Tracker installed');
});

chrome.runtime.onStartup.addListener(() => {
  scheduleMidnightReset();

  // Restore badge from stored state on browser startup
  chrome.storage.local.get(STORAGE_KEY, (result) => {
    const data = result[STORAGE_KEY];
    if (data && typeof data.countToday === 'number') {
      updateBadge(data.countToday);
    }
  });
});
