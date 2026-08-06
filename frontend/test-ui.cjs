const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login');
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'onereceptionist@gmail.com');
  await page.type('input[type="password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'dashboard.png' });
  await page.goto('http://localhost:5173/staff/appointments');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'appointments.png' });
  await page.goto('http://localhost:5173/staff/patients');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'patients.png' });
  await browser.close();
})();
