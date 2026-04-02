import { chromium } from 'playwright';

(async () => {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    console.log("Navegando para a página...");
    await page.goto('http://127.0.0.1:5173/distribuidores/login', { waitUntil: 'networkidle' });
    
    await page.waitForTimeout(1000);
    
    const html = await page.content();
    console.log(html);
    
    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
