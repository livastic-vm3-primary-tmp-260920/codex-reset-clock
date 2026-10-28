# Codex Limit Clock — free English + 한국어 reset-time calculator

An **independent**, free, ad-free, no-login browser utility for converting an
individual's **Codex usage-limit refresh times** into an accurate countdown
and timezone-aware calendar reminders.

**Live (GitHub Pages, static, no paid hosting):**
- English: https://livastic-vm3-primary-tmp-260920.github.io/codex-reset-clock/
- 한국어: https://livastic-vm3-primary-tmp-260920.github.io/codex-reset-clock/ko/

The website is **not affiliated with OpenAI** and **does not** connect to
any OpenAI account, read balances, retrieve private reset times, promise
global resets, or trigger a reset. The visitor must enter their exact
account-specific time from Codex/ChatGPT Settings → Usage. Banked reset
expiration is not a scheduled automatic reset.

## Features users can actually use

- Three **independently entered** dates: applicable 5-hour refresh, weekly
  refresh and **banked reset expiration**; no made-up defaults.
- Device-local time interpretation, live seconds countdown, and comparison
  across Seoul, UTC, New York, Los Angeles, London, Berlin, Tokyo,
  Singapore, Sydney or detected device zone.
- An **estimate only** action: elapsed 5 hours from a visitor-entered
  start time, explicitly not equivalent to the official account countdown.
- UTC/ISO 8601 announcement-time converter (timestamp must include Z or
  an explicit offset); no validation that a public announcement exists.
- **Local .ics file download** with a 15-minute-before reminder for a
  future user-entered date. No account permissions or notifications.
- **Optional explicit local-only preference** for retaining three times
  across browser sessions. Without permission, nothing is stored by the
  app. Clear removes any prior saved local record. No date appears in a
  shareable link.
- A **clearly marked fictional demo** to try the interface without
  mistaking example dates for real Codex/reset announcements.
- Separate substantive search-indexable English and Korean pages,
  canonical/hreflang meta, and a two-page XML sitemap.
- Responsive accessible markup, no external CSS/JS, no analytics,
  no advertising script, no tracking pixels, no credentials, no server
  processes and no dependence on an OpenAI API.

The website itself is hosted by GitHub Pages; like any host, GitHub
receives ordinary HTTP request metadata needed to deliver website files.
The app does not fetch external origins; links to official help and status
resources open **only if a visitor chooses to click them**.

## Why we do not predict a global reset

OpenAI describes **three different** one-time benefits: user-redeemed banked
resets, automatic resets applied to a specified eligible group, and paid
instant resets for eligible accounts. These differ from normal plan-specific
5-hour and weekly usage windows. Free promotional resets have **no
guaranteed future schedule**. A community tracker that counts past reset
dates cannot know which accounts will qualify for a future announcement.

Authoritative references (read 2026-10-28, terms may change):
- https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- https://help.openai.com/en/articles/20001498-how-resets-work-in-codex
- https://help.openai.com/en/articles/20001516-managing-usage-with-gpt-6-astra-in-work-and-codex
- https://help.openai.com/en/articles/20001507-paid-weekly-work-and-codex-rate-limit-resets
- https://status.openai.com/ (service health; not Codex allowance)

There is **no live global-reset news monitoring/notification feed** in v1.0.
"Live" means the on-device clock and countdown only. Any official policies
may change; the original usage settings should be trusted over this tool.

## Build + test

Requires Python 3.11+ and Node.js 22+. No npm dependencies.

```sh
python3 scripts/build_pages.py
python3 scripts/build_pages.py --check
node --test
node scripts/browser-smoke.mjs
```

Output is byte-for-byte reproducible in the `docs/` directory. GitHub Pages
publishes directly from branch `main` and folder `/docs`. The JavaScript
business logic is in `src/core.mjs` and automatically copied to
`docs/assets/core.mjs`; the shared UI is `docs/assets/app.mjs`.

## Local privacy notes

1. No server endpoint, API call, cookies, ads, OAuth or external JavaScript.
2. The optional "Remember" checkbox writes only three timestamps and a
   preferred timezone to browser `localStorage`. No account numbers,
   emails, ChatGPT conversations or API keys are used.
3. Never share private usage screenshots or authentication credentials.
4. The .ics reminder is generated with JavaScript and downloaded locally.
5. The timer uses the visitor's device clock and timezone; a wrong device
   clock can produce a wrong result. DST "fall back" repeated hour can be
   ambiguous in browsers, so check official account details.

## Deployment safety

This project is separate from the original LocalCSV Lab paid-ad domain
https://tools.trendbridged.com/ . No Netlify site code, opt-in consent,
Adsterra units, publisher balance, payouts or production credit budgets
are touched by this repo. The public GitHub Pages site is **ad-free**.
An actual increase in Google search clicks, independent users or money
must be verified, never inferred from a new deployment.

MIT License. Independent educational/time-utility project, not sponsored,
approved or endorsed by OpenAI.
