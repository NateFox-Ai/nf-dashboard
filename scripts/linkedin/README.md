# LinkedIn Auto-Connect

## What This Does

Finds coaches/consultants on LinkedIn and sends connection requests with personalized notes.

**Cost:** Near zero — uses rule-based filtering, no AI per prospect.

## Setup

1. Set credentials:
```bash
export LINKEDIN_EMAIL="your-email@example.com"
export LINKEDIN_PASSWORD="your-password"
```

2. Run:
```bash
cd scripts/linkedin
DISPLAY=:0 node linkedin-connect.js
```

## How It Works

1. **Searches** LinkedIn for terms like "coach", "consultant", "business coach"
2. **Filters** profiles using keyword matching (no AI):
   - Must contain: coach, consultant, advisor, founder, etc.
   - Must NOT contain: student, intern, recruiter, etc.
3. **Sends** connection request with personalized note
4. **Logs** everything to `connection-log.csv`

## Limits

- **20 connections per run** (conservative — LinkedIn limit is ~100/week)
- **8 second delay** between requests
- Spread across 12 search terms

## Output

| File | Purpose |
|------|---------|
| `connection-log.csv` | All connections sent/skipped |
| `screenshots/feed.png` | Screenshot after login |
| `screenshots/error.png` | Screenshot if something breaks |

## Safety

- Runs in visible browser (not headless) — you can watch it
- Stops if verification/CAPTCHA appears
- Respects LinkedIn rate limits
- Skips profiles without "Connect" button

## Customization

Edit `linkedin-connect.js` to change:
- Search terms (line 30)
- Target/exclude keywords (lines 45–55)
- Connection note (line 58)
- Daily limit (line 42)
