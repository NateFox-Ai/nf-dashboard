#!/usr/bin/env node
/**
 * LinkedIn Auto-Connect Script
 * 
 * Finds coaches/consultants on LinkedIn and sends connection requests.
 * Uses RULE-BASED filtering (no LLM per prospect) to keep costs near zero.
 * 
 * Usage: DISPLAY=:0 node linkedin-connect.js
 * 
 * Strategy:
 * 1. Search LinkedIn for target keywords
 * 2. Scrape profile cards from search results
 * 3. Filter by job title keywords (rule-based)
 * 4. Send personalized connection note
 * 5. Log everything to CSV
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── CONFIG ──────────────────────────────────────────────────────────
const CONFIG = {
  // LinkedIn credentials (stored in env or prompt)
  email: process.env.LINKEDIN_EMAIL || 'nathanfox328@gmail.com',
  password: process.env.LINKEDIN_PASSWORD || 'NateFox2024!LI',

  // Search parameters
  searches: [
    'coach',
    'business coach',
    'life coach',
    'executive coach',
    'consultant',
    'business consultant',
    'marketing consultant',
    'career coach',
    'leadership coach',
    'health coach',
    'mindset coach',
    'sales coach',
  ],

  // Target filters
  maxConnectionsPerRun: 20,     // LinkedIn limit is ~100/week, be conservative
  maxConnectionsPerSearch: 5,   // Spread across searches
  connectionDelayMs: 8000,      // 8 seconds between requests (human-like)

  // Rule-based filtering (zero AI cost)
  targetTitles: [
    'coach', 'consultant', 'advisor', 'mentor', 'strategist',
    'founder', 'owner', 'ceo', 'director', 'principal',
  ],
  excludeTitles: [
    'student', 'intern', 'junior', 'assistant', 'associate',
    'recruiter', 'hr', 'sales rep', 'account manager',
  ],
  targetIndustries: [
    'coaching', 'consulting', 'professional services',
    'personal development', 'business services',
  ],

  // Connection note template (300 char max)
  // [NAME] gets replaced with their first name
  connectionNote: `Hey [NAME] — I help coaches and consultants automate their client onboarding so nothing falls through the cracks. Would love to connect!`,

  // Output
  logFile: path.join(__dirname, 'connection-log.csv'),
  screenshotDir: path.join(__dirname, 'screenshots'),
};

// ─── UTILITIES ───────────────────────────────────────────────────────
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

function appendLog(entry) {
  const line = [
    entry.timestamp,
    entry.name,
    entry.title,
    entry.company,
    entry.profileUrl,
    entry.status,
    entry.note || '',
  ].map(f => `"${String(f).replace(/"/g, '""')}"`).join(',');

  const header = 'timestamp,name,title,company,profileUrl,status,note';
  const fileExists = fs.existsSync(CONFIG.logFile);
  fs.appendFileSync(CONFIG.logFile, (fileExists ? '\n' : header + '\n') + line);
}

function sanitizeName(name) {
  return name.split(' ')[0].replace(/[^a-zA-Z]/g, '');
}

// ─── RULE-BASED FILTERING (ZERO AI COST) ─────────────────────────────
function isTargetProfile(name, title, company, headline) {
  const text = `${title} ${headline} ${company}`.toLowerCase();

  // Must contain at least one target keyword
  const hasTarget = CONFIG.targetTitles.some(kw => text.includes(kw.toLowerCase()));
  if (!hasTarget) return { pass: false, reason: 'no_target_keyword' };

  // Must NOT contain exclusion keywords
  const hasExclude = CONFIG.excludeTitles.some(kw => text.includes(kw.toLowerCase()));
  if (hasExclude) return { pass: false, reason: 'excluded_title' };

  // Prefer profiles that mention coaching/consulting explicitly
  const strongSignal = CONFIG.targetIndustries.some(kw => text.includes(kw.toLowerCase()));

  return {
    pass: true,
    reason: strongSignal ? 'strong_signal' : 'weak_signal',
    score: strongSignal ? 2 : 1,
  };
}

// ─── LINKEDIN AUTOMATION ─────────────────────────────────────────────
async function run() {
  log('🚀 Starting LinkedIn auto-connect...');

  // Prompt for credentials if not in env
  if (!CONFIG.email || !CONFIG.password) {
    console.error('❌ Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD env vars');
    process.exit(1);
  }

  // Ensure screenshot dir exists
  if (!fs.existsSync(CONFIG.screenshotDir)) {
    fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,  // Must be visible for LinkedIn
    slowMo: 100,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0',
  });

  const page = await context.newPage();

  try {
    // ─── LOGIN ─────────────────────────────────────────────────────
    log('🔐 Logging in...');
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle' });
    await page.fill('#username', CONFIG.email);
    await page.fill('#password', CONFIG.password);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await delay(3000);

    // Check for verification/CAPTCHA
    const currentUrl = page.url();
    if (currentUrl.includes('checkpoint') || currentUrl.includes('challenge')) {
      log('⚠️  Verification required! Please solve manually in the browser.');
      log('   Waiting 60 seconds for you to complete...');
      await delay(60000);
    }

    // Take screenshot of feed to confirm login
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, 'feed.png') });
    log('✅ Logged in successfully');

    // ─── SEARCH & CONNECT ──────────────────────────────────────────
    let totalSent = 0;
    const processedUrls = new Set();

    for (const searchTerm of CONFIG.searches) {
      if (totalSent >= CONFIG.maxConnectionsPerRun) break;

      log(`🔍 Searching: "${searchTerm}"`);

      // Navigate to people search
      const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(searchTerm)}&origin=SWITCH_SEARCH_VERTICAL&sid=abc`;
      await page.goto(searchUrl, { waitUntil: 'networkidle' });
      await delay(4000);

      // Scroll to load more results
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, 800));
        await delay(1500);
      }

      // Extract profile cards
      const profiles = await page.evaluate(() => {
        const cards = document.querySelectorAll('.entity-result__item, .search-result__info, [data-test-id="search-result"]');
        const results = [];
        cards.forEach(card => {
          const nameEl = card.querySelector('.entity-result__title-text a, .actor-name, .app-aware-link span[aria-hidden]');
          const titleEl = card.querySelector('.entity-result__primary-subtitle, .subline-level-1, .t-14.t-normal');
          const companyEl = card.querySelector('.entity-result__secondary-subtitle, .subline-level-2');
          const linkEl = card.querySelector('.app-aware-link, a[href*="/in/"]');
          const connectBtn = card.querySelector('button[aria-label*="Connect"], button[data-test-id="connect-button"]');

          if (nameEl && linkEl) {
            results.push({
              name: nameEl.innerText.trim(),
              title: titleEl ? titleEl.innerText.trim() : '',
              company: companyEl ? companyEl.innerText.trim() : '',
              profileUrl: linkEl.href.split('?')[0],
              hasConnectButton: !!connectBtn,
            });
          }
        });
        return results;
      });

      log(`   Found ${profiles.length} profiles`);

      let sentThisSearch = 0;

      for (const profile of profiles) {
        if (totalSent >= CONFIG.maxConnectionsPerRun) break;
        if (sentThisSearch >= CONFIG.maxConnectionsPerSearch) break;
        if (processedUrls.has(profile.profileUrl)) continue;

        processedUrls.add(profile.profileUrl);

        // Rule-based filter (ZERO AI COST)
        const filter = isTargetProfile(profile.name, profile.title, profile.company, profile.title);
        if (!filter.pass) {
          log(`   ⏭️  Skipped ${profile.name} — ${filter.reason}`);
          appendLog({
            timestamp: new Date().toISOString(),
            name: profile.name,
            title: profile.title,
            company: profile.company,
            profileUrl: profile.profileUrl,
            status: 'skipped',
            note: filter.reason,
          });
          continue;
        }

        log(`   👤 ${profile.name} — ${profile.title} @ ${profile.company} (${filter.reason})`);

        // Navigate to profile and connect
        try {
          await page.goto(profile.profileUrl, { waitUntil: 'networkidle' });
          await delay(3000);

          // Find and click Connect button
          const connectBtn = await page.$('button[aria-label*="Connect"], button:has-text("Connect")');
          if (!connectBtn) {
            log(`   ⚠️  No Connect button on profile`);
            appendLog({
              timestamp: new Date().toISOString(),
              name: profile.name,
              title: profile.title,
              company: profile.company,
              profileUrl: profile.profileUrl,
              status: 'no_connect_button',
              note: '',
            });
            continue;
          }

          await connectBtn.click();
          await delay(2000);

          // Check for "Add a note" option
          const addNoteBtn = await page.$('button[aria-label*="Add a note"], button:has-text("Add a note")');
          if (addNoteBtn) {
            await addNoteBtn.click();
            await delay(1000);

            // Fill in personalized note
            const firstName = sanitizeName(profile.name);
            const note = CONFIG.connectionNote.replace('[NAME]', firstName);
            await page.fill('textarea[name="message"], textarea#custom-message', note);
            await delay(500);

            // Click Send
            const sendBtn = await page.$('button[aria-label*="Send"], button:has-text("Send")');
            if (sendBtn) await sendBtn.click();
          } else {
            // Just click Send without note
            const sendBtn = await page.$('button[aria-label*="Send"], button:has-text("Send")');
            if (sendBtn) await sendBtn.click();
          }

          await delay(CONFIG.connectionDelayMs);

          log(`   ✅ Connected with ${profile.name}`);
          appendLog({
            timestamp: new Date().toISOString(),
            name: profile.name,
            title: profile.title,
            company: profile.company,
            profileUrl: profile.profileUrl,
            status: 'connected',
            note: filter.reason,
          });

          totalSent++;
          sentThisSearch++;

        } catch (err) {
          log(`   ❌ Error connecting with ${profile.name}: ${err.message}`);
          appendLog({
            timestamp: new Date().toISOString(),
            name: profile.name,
            title: profile.title,
            company: profile.company,
            profileUrl: profile.profileUrl,
            status: 'error',
            note: err.message,
          });
        }
      }

      log(`   Sent ${sentThisSearch} connections for "${searchTerm}"`);
    }

    log(`\n🎉 Done! Total connections sent: ${totalSent}`);
    log(`📊 Log saved to: ${CONFIG.logFile}`);

  } catch (err) {
    log(`❌ Fatal error: ${err.message}`);
    await page.screenshot({ path: path.join(CONFIG.screenshotDir, 'error.png') });
  } finally {
    await browser.close();
  }
}

// ─── RUN ─────────────────────────────────────────────────────────────
run().catch(console.error);
