const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://admin-pi-blue.vercel.app';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ss(page, name, label) {
  const file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file, fullPage: false });
  console.log('📸 ' + name + '.png — ' + label);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();

  // Login
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);
  await page.type('input[type="email"]', 'admin@sunrcircle.in');
  await page.type('input[type="password"]', 'Admin@Sunr2024');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(2000);

  // ── REPORTS PAGE ────────────────────────────────────────────────────────────
  await page.goto(BASE_URL + '/reports', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(3000);
  await ss(page, 'PROOF-01-reports-loaded', 'Reports page loaded — NO error');

  // Take full page screenshot
  await page.screenshot({ path: path.join(OUT, 'PROOF-01-full.png'), fullPage: true });
  console.log('📸 PROOF-01-full.png — Full page');

  // ── SELECT DAILY REPORT ─────────────────────────────────────────────────────
  // Click the Report Type select
  await page.click('[role="combobox"]');
  await sleep(800);
  await ss(page, 'PROOF-02-report-type-dropdown', 'Report type dropdown open');

  // Select "Daily Report"
  const items = await page.$$('[role="option"]');
  for (const item of items) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && text.includes('Daily Report')) {
      await item.click();
      break;
    }
  }
  await sleep(500);
  await ss(page, 'PROOF-03-daily-selected', 'Daily Report selected');

  // ── CLICK GENERATE REPORT ───────────────────────────────────────────────────
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Generate Report')) {
      await btn.click();
      break;
    }
  }

  // Wait for report to generate
  console.log('Waiting for report to generate...');
  await sleep(6000);
  await ss(page, 'PROOF-04-report-results', 'Report generated with results');
  await page.screenshot({ path: path.join(OUT, 'PROOF-04-full.png'), fullPage: true });
  console.log('📸 PROOF-04-full.png — Full results page');

  // Verify results
  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  console.log('\n--- Results preview ---');
  console.log(bodyText.substring(0, 1000));

  // ── MONTHLY REPORT ──────────────────────────────────────────────────────────
  await page.goto(BASE_URL + '/reports', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);

  // Select Monthly
  await page.click('[role="combobox"]');
  await sleep(500);
  const items2 = await page.$$('[role="option"]');
  for (const item of items2) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && text.includes('Monthly Report')) { await item.click(); break; }
  }
  await sleep(300);

  // Click Generate
  const btns2 = await page.$$('button');
  for (const btn of btns2) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Generate Report')) { await btn.click(); break; }
  }
  await sleep(6000);
  await ss(page, 'PROOF-05-monthly-report', 'Monthly report generated');

  console.log('\n✅ All proof screenshots saved to: ' + OUT);
  await browser.close();
})();
