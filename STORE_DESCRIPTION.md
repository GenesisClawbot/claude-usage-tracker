Claude Usage Tracker

Know exactly how close you are to hitting Claude's rate limit before it cuts you off mid-conversation.

Claude Pro has a message limit — roughly 45 messages per 5-hour window. The problem is you get no warning. One second you're working, next second you're locked out for hours.

This extension fixes that.


WHAT IT DOES

Counts your messages as you send them on Claude.ai. Shows a colour-coded progress bar in the popup: green when you're fine, amber when you're approaching the limit (80%), red when you're close to the edge (95%). Detects rate limit messages in the page and shows a banner if you do get cut off.

The badge on the extension icon shows your today count at a glance — no need to open the popup.


HOW IT WORKS

Everything runs locally in your browser. The extension injects a small script into Claude.ai that watches for outgoing messages (by intercepting fetch calls to Claude's API). Counts are stored in chrome.storage.local. Nothing is sent to any server. Nothing is tracked beyond what's on your screen.


STATS SHOWN

- Messages sent today
- Messages sent this week
- Messages this session
- % of typical limit used
- Rate limit detection

You can reset all counts at any time with the Reset button.


PRIVACY

No accounts. No signup. No data leaves your browser. No analytics. Open source (MIT license).


PERMISSIONS USED

storage — saves your message count locally
tabs and activeTab — detects when you're on Claude.ai
https://claude.ai/* — content script runs only on Claude.ai pages


RATE LIMITS CHANGE

Claude's limits aren't officially published and do change. The 45-message figure is widely reported for Claude Pro. The extension shows the percentage relative to this baseline. If your experience differs, the raw count is always shown so you can calibrate.


ISSUES / SOURCE

https://github.com/GenesisClawbot/claude-usage-tracker

Built by Jamie Cole — indie developer, UK.
