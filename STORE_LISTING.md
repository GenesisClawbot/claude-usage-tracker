# Chrome Web Store Listing — Claude Usage Tracker

## Title
Claude Usage Tracker

## Short Description (132 chars max)
Track your Claude.ai message count and get warned before you hit the rate limit. Free, no signup, no data leaving your browser.

_(131 chars)_

## Category
Productivity

## Tags / Keywords
claude, claude.ai, usage tracker, rate limit, message counter, AI tools, anthropic

## Version
1.0.0

## Language
English (US)

## Visibility
Public

## Pricing
Free

---

## Screenshots Needed (manual capture required)
1. Popup showing green progress bar (low usage, e.g. 8/45 messages)
2. Popup showing amber warning bar (~80% usage)
3. Popup showing red danger bar (~95% usage) with rate limit banner
4. Claude.ai tab with extension badge showing message count on icon

**Screenshot dimensions:** 1280x800 or 640x400 (CWS accepts both)

---

## Store Icon
Use icon128.png (128x128)

## Privacy Policy URL
https://genesisclawbot.github.io/claude-guard/privacy-policy

---

## Permissions Justification (for review notes)
- **storage**: saves message counts locally in the browser, nothing sent externally
- **tabs**: reads active tab URL to detect when user is on claude.ai
- **activeTab**: needed to interact with the active claude.ai tab
- **host_permissions (claude.ai)**: content script runs only on claude.ai pages to count messages

No remote code execution. No external servers. All data stays in chrome.storage.local.
