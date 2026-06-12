const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/session');
  console.log("Loaded page, waiting 2s...");
  await page.waitForTimeout(2000);
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err));

  console.log("Clicking start interview...");
  // Find button with text "Start Interview"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const startBtn = btns.find(b => b.textContent.includes('Start Interview'));
    if(startBtn) startBtn.click();
  });
  
  await page.waitForTimeout(2000);
  console.log("Done");
  await browser.close();
})();
