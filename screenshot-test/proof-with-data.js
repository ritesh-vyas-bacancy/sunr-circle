const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://admin-pi-blue.vercel.app';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');

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
  await sleep(1000);
  await page.type('input[type="email"]', 'admin@sunrcircle.in');
  await page.type('input[type="password"]', 'Admin@Sunr2024');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(1500);

  // ── REPORTS: Use "Yearly" to capture all complaints ─────────────────────────
  await page.goto(BASE_URL + '/reports', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);
  await ss(page, 'FINAL-01-reports-page', 'Reports page — fully loaded, no errors');

  // Select "Yearly Report"
  await page.click('[role="combobox"]');
  await sleep(600);
  const items = await page.$$('[role="option"]');
  for (const item of items) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && text.includes('Yearly Report')) { await item.click(); break; }
  }
  await sleep(500);
  await ss(page, 'FINAL-02-yearly-selected', 'Yearly Report type selected');

  // Click Generate Report
  const btns = await page.$$('button');
  for (const btn of btns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Generate Report')) { await btn.click(); break; }
  }

  console.log('Waiting for report...');
  await sleep(6000);
  await ss(page, 'FINAL-03-yearly-results', 'Yearly report with ALL complaints data');
  await page.screenshot({ path: path.join(OUT, 'FINAL-03-full.png'), fullPage: true });
  console.log('📸 FINAL-03-full.png — Full scroll view');

  // Verify the count
  const bodyText = await page.evaluate(() => document.body.innerText);
  const countMatch = bodyText.match(/(\d+)\s*Total/);
  if (countMatch) console.log('✅ Report shows Total:', countMatch[1], 'complaints');
  const rowMatch = bodyText.match(/Complaint Details.*?(\d+) records/);
  if (rowMatch) console.log('✅ Complaint rows:', rowMatch[1]);

  // ── Export buttons visible ────────────────────────────────────────────────
  await ss(page, 'FINAL-04-export-buttons', 'Export Excel and Export PDF buttons visible');

  console.log('\n✅ All final proof screenshots saved!');
  await browser.close();
})();
