const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    storageState: 'c:/cotarco-revendedores/cotarco-client/playwright/.auth/partner.json'
  });
  const page = await context.newPage();
  
  await page.goto('http://127.0.0.1:5173/distribuidores/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000); // Give it time to load and render
  
  await page.screenshot({ path: 'c:/cotarco-revendedores/cotarco-client/debug_partner.png', fullPage: true });
  
  const content = await page.content();
  const fs = require('fs');
  fs.writeFileSync('c:/cotarco-revendedores/cotarco-client/debug_partner.html', content);
  
  await browser.close();
  console.log('Saved screenshot and html');
})();
