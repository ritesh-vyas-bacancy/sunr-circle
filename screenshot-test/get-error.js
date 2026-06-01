const puppeteer = require('./node_modules/puppeteer-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://admin-pi-blue.vercel.app';

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });

  // Capture all response errors
  page.on('response', resp => {
    if (resp.status() >= 400) {
      console.log(`RESPONSE ${resp.status()}: ${resp.url()}`);
    }
  });

  // Login first
  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1000);
  await page.type('input[type="email"]', 'admin@sunrcircle.in');
  await page.type('input[type="password"]', 'Admin@Sunr2024');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(1000);
  console.log('Logged in. URL:', page.url());

  // Now try reports
  const reportResponse = await page.goto(BASE_URL + '/reports', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  await sleep(2000);
  console.log('Reports status:', reportResponse.status());
  console.log('Reports URL:', page.url());

  // Get the full HTML to see the error
  const html = await page.content();

  // Extract useful error info
  const errorMatch = html.match(/digest[^"]*"([^"]+)"/i);
  const messageMatch = html.match(/error.*?message[^>]*>([^<]+)</i);

  console.log('\n--- PAGE BODY ---');
  // Get just visible text
  const visibleText = await page.evaluate(() => {
    return document.body.innerText.trim().substring(0, 2000);
  });
  console.log(visibleText);

  // Try to get error details
  const errorInfo = await page.evaluate(() => {
    const pre = document.querySelectorAll('pre');
    const divs = document.querySelectorAll('[data-nextjs-error-overlay]');
    const errors = [];
    pre.forEach(p => errors.push(p.textContent));
    divs.forEach(d => errors.push(d.textContent));
    return errors.join('\n');
  });

  if (errorInfo) console.log('\n--- ERROR DETAILS ---\n' + errorInfo);

  await browser.close();
})();
