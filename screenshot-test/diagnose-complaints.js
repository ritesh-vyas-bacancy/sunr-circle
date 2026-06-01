const puppeteer = require('./node_modules/puppeteer-core');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://admin-pi-blue.vercel.app';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 }
  });
  const page = await browser.newPage();
  page.on('console', msg => { if (msg.type() === 'error') console.log('JS ERROR:', msg.text().substring(0, 300)); });

  await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1000);
  await page.type('input[type="email"]', 'admin@sunrcircle.in');
  await page.type('input[type="password"]', 'Admin@Sunr2024');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 });
  await sleep(1500);

  await page.goto(BASE_URL + '/complaints', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(3000);

  const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
  console.log('--- PAGE TEXT ---');
  console.log(bodyText);
  await browser.close();
})();
