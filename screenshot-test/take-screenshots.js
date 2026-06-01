const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://admin-pi-blue.vercel.app';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function screenshot(page, name, label) {
  const file = path.join(OUT_DIR, name + '.png');
  await page.screenshot({ path: file, fullPage: false });
  console.log('✅ Screenshot saved: ' + name + '.png — ' + label);
  return file;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  try {
    // ── 1. LOGIN ──────────────────────────────────────────────────────────────
    console.log('Navigating to login...');
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);
    await screenshot(page, '01-login-page', 'Login page loaded');

    // Fill credentials
    await page.type('input[type="email"]', 'admin@sunrcircle.in');
    await page.type('input[type="password"]', 'Admin@Sunr2024');
    await sleep(500);
    await screenshot(page, '02-login-filled', 'Credentials filled');

    // Submit login
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);
    await screenshot(page, '03-dashboard', 'Dashboard after login');
    console.log('Current URL: ' + page.url());

    // ── 2. REPORTS PAGE ──────────────────────────────────────────────────────
    console.log('Navigating to /reports...');
    await page.goto(BASE_URL + '/reports', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);
    await screenshot(page, '04-reports-page', 'Reports page loaded');
    console.log('Reports URL: ' + page.url());

    // Check if page shows error
    const pageContent = await page.content();
    if (pageContent.includes("couldn't load") || pageContent.includes('This page')) {
      console.log('❌ ERROR: Page shows "This page couldn\'t load"');
    } else {
      console.log('✅ Reports page rendered successfully (no error message)');
    }

    // ── 3. SET REPORT TYPE = MONTHLY ─────────────────────────────────────────
    // Try clicking the report type selector
    try {
      const selectTrigger = await page.$('[data-radix-collection-item], [role="combobox"]');
      if (selectTrigger) {
        await selectTrigger.click();
        await sleep(500);
        await screenshot(page, '05-report-type-dropdown', 'Report type dropdown open');
      }
    } catch(e) { console.log('Select click: ' + e.message); }

    // ── 4. CLICK GENERATE REPORT ─────────────────────────────────────────────
    await page.goto(BASE_URL + '/reports', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // Find and click Generate Report button
    const buttons = await page.$$('button');
    let generateBtn = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Generate Report')) {
        generateBtn = btn;
        break;
      }
    }

    if (generateBtn) {
      console.log('Found Generate Report button — clicking...');
      await generateBtn.click();
      await sleep(5000); // Wait for report to generate
      await screenshot(page, '06-report-generated', 'Report generated with data');

      // Check for results
      const content = await page.content();
      if (content.includes('total complaints') || content.includes('Total') || content.includes('Showing')) {
        console.log('✅ Report data is visible!');
      }
    } else {
      console.log('Generate button not found - taking screenshot anyway');
      await screenshot(page, '06-reports-full', 'Full reports page');
    }

    // ── 5. SCROLL DOWN TO SEE MORE ────────────────────────────────────────────
    await page.evaluate(() => window.scrollTo(0, 300));
    await sleep(500);
    await screenshot(page, '07-reports-scrolled', 'Reports page scrolled');

    console.log('\n✅ All screenshots taken in: ' + OUT_DIR);

  } catch (err) {
    console.log('❌ Error: ' + err.message);
    await screenshot(page, 'error-state', 'Error state').catch(() => {});
  } finally {
    await browser.close();
  }
})();
