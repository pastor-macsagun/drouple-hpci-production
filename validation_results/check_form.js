const { chromium } = require('playwright');

async function checkForm() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://drouple-hpci-prod.vercel.app/auth/signin');
  await page.waitForLoadState('networkidle');
  
  // Get all input fields
  const inputs = await page.$$eval('input', elements => 
    elements.map(el => ({
      name: el.name,
      id: el.id,
      type: el.type,
      placeholder: el.placeholder,
      ariaLabel: el.getAttribute('aria-label')
    }))
  );
  
  console.log('Found inputs:', inputs);
  
  // Get all buttons
  const buttons = await page.$$eval('button', elements => 
    elements.map(el => ({
      text: el.textContent,
      type: el.type
    }))
  );
  
  console.log('Found buttons:', buttons);
  
  await browser.close();
}

checkForm();