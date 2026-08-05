const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

function findChrome() {
  const candidates = [
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
  ].filter(Boolean);
  const found = candidates.find(fs.existsSync);
  if (!found) throw new Error('Chrome/Edge executable not found');
  return found;
}

async function capture(name, viewport, isMobile = false) {
  const browser = await chromium.launch({ headless: true, executablePath: findChrome() });
  try {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile });
    const page = await context.newPage();
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
    page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
    await page.route(/googletagmanager|googlesyndication|doubleclick|google-analytics/, route => route.abort());
    await page.goto('https://itdong.me/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(__dirname, `${name}.png`), fullPage: true });
    const result = await page.evaluate(() => {
      const pick = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return {
          tag: el.tagName,
          id: el.id,
          className: typeof el.className === 'string' ? el.className : '',
          text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 400),
          box: { x: r.x, y: r.y, width: r.width, height: r.height },
          style: {
            display: s.display,
            position: s.position,
            color: s.color,
            backgroundColor: s.backgroundColor,
            backgroundImage: s.backgroundImage,
            fontFamily: s.fontFamily,
            fontSize: s.fontSize,
            fontWeight: s.fontWeight,
            lineHeight: s.lineHeight,
            borderRadius: s.borderRadius,
            boxShadow: s.boxShadow
          }
        };
      };
      const selectors = [
        'body', 'header', '.page-header', '.navbar', '#navbar-main', '.navbar-brand',
        '.header-card', '.site-title', '.site-description', 'main', '#primary',
        '.leftbar-banner', '.content', '.post', 'article', '.card', '.post-title',
        '.post-content', '.post-meta', '.sidebar', '#secondary', 'footer', '.footer'
      ];
      const samples = {};
      for (const selector of selectors) {
        samples[selector] = [...document.querySelectorAll(selector)].slice(0, 8).map(pick);
      }
      return {
        title: document.title,
        url: location.href,
        htmlClass: document.documentElement.className,
        bodyClass: document.body.className,
        bodyScrollHeight: document.body.scrollHeight,
        viewport: { width: innerWidth, height: innerHeight },
        samples,
        headings: [...document.querySelectorAll('h1,h2,h3,h4')].map(pick).slice(0, 60),
        nav: [...document.querySelectorAll('nav a')].map(pick).slice(0, 60),
        images: [...document.images].map(img => ({ alt: img.alt, src: img.currentSrc || img.src, width: img.naturalWidth, height: img.naturalHeight, box: pick(img)?.box })).slice(0, 100),
        stylesheets: [...document.styleSheets].map(s => s.href).filter(Boolean),
        links: [...document.querySelectorAll('a')].map(a => ({ text: (a.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 100), href: a.href, className: a.className })).slice(0, 150)
      };
    });
    result.errors = errors;
    fs.writeFileSync(path.join(__dirname, `${name}.json`), JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

(async () => {
  await capture('original-desktop-1440', { width: 1440, height: 1000 });
  await capture('original-mobile-390', { width: 390, height: 844 }, true);
})().catch(err => { console.error(err); process.exitCode = 1; });
