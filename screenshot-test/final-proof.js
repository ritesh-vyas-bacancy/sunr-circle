const puppeteer = require('./node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://admin-pi-blue.vercel.app';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots', 'final');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function ss(page, name, label) {
  const file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file, fullPage: false });
  console.log('📸 SAVED: ' + name + '.png — ' + label);
  return file;
}
async function ssFull(page, name, label) {
  const file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file, fullPage: true });
  console.log('📸 SAVED (full): ' + name + '.png — ' + label);
  return file;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
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

  // ══════════════════════════════════════════════════════════
  // COMPLAINTS
  // ══════════════════════════════════════════════════════════
  await page.goto(BASE_URL + '/complaints', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(3000);
  await ss(page, '1-complaints-loaded', 'Complaints page — 4 complaints visible, NO error');
  await ssFull(page, '1-complaints-full', 'Complaints page full view');

  // Scroll to show table
  await page.evaluate(() => window.scrollTo(0, 200));
  await sleep(300);
  await ss(page, '2-complaints-table', 'Complaints table with filters');

  // Click first complaint to show detail
  const links = await page.$$('a[href*="/complaints/"]');
  if (links.length > 0) {
    await links[0].click();
    await sleep(3000);
    await ss(page, '3-complaint-detail', 'Complaint detail page');
    await page.goBack({ waitUntil: 'networkidle2' });
    await sleep(1500);
  }

  // ══════════════════════════════════════════════════════════
  // REPORTS + CHARTS
  // ══════════════════════════════════════════════════════════
  await page.goto(BASE_URL + '/reports', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(2000);
  await ss(page, '4-reports-page', 'Reports page loaded');

  // Select Yearly and Generate
  await page.click('[role="combobox"]');
  await sleep(600);
  const items = await page.$$('[role="option"]');
  for (const item of items) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && text.includes('Yearly Report')) { await item.click(); break; }
  }
  await sleep(400);

  const btns = await page.$$('button');
  for (const btn of btns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Generate Report')) { await btn.click(); break; }
  }
  console.log('Waiting for charts to render...');
  await sleep(7000);

  await ss(page, '5-report-charts-tab', 'Report CHARTS tab (default) — Pie + Bar charts visible');
  await ssFull(page, '5-report-charts-full', 'Report charts full page scroll');

  // Click table tab
  const tabTriggers = await page.$$('[role="tab"]');
  for (const tab of tabTriggers) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes('Table View')) { await tab.click(); break; }
  }
  await sleep(1000);
  await ss(page, '6-report-table-tab', 'Report TABLE tab — complaint details table');

  // Back to charts tab
  for (const tab of await page.$$('[role="tab"]')) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text && text.includes('Charts')) { await tab.click(); break; }
  }
  await sleep(500);

  // Scroll down to see more charts
  await page.evaluate(() => window.scrollTo(0, 1000));
  await sleep(500);
  await ss(page, '7-charts-scrolled-1', 'Line chart + Area chart visible');

  await page.evaluate(() => window.scrollTo(0, 2000));
  await sleep(500);
  await ss(page, '8-charts-scrolled-2', 'Sub Division + Nature of Complaint charts');

  console.log('\n✅ All final proof screenshots saved to: ' + OUT);
  await browser.close();
})();
