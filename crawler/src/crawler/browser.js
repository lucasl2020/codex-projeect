import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getSetting } from '../db/repositories.js';

/** @type {import('playwright').Browser | null} */
let sharedBrowser = null;
let launching = null;
let lastHeadless = true;
let lastKey = '';

function candidateExecutables() {
  const list = [];
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
    list.push(process.env.PLAYWRIGHT_EXECUTABLE_PATH);
  }
  const home = os.homedir();
  const ms = path.join(home, 'AppData', 'Local', 'ms-playwright');
  if (fs.existsSync(ms)) {
    try {
      for (const dir of fs.readdirSync(ms)) {
        if (!dir.startsWith('chromium-')) continue;
        const p = path.join(ms, dir, 'chrome-win64', 'chrome.exe');
        if (fs.existsSync(p)) list.push(p);
        const p2 = path.join(ms, dir, 'chrome-win', 'chrome.exe');
        if (fs.existsSync(p2)) list.push(p2);
      }
    } catch {
      /* ignore */
    }
  }
  const chromePaths = [
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ];
  for (const p of chromePaths) if (p && fs.existsSync(p)) list.push(p);
  return list;
}

async function launchBrowser(headless) {
  // 1) bundled playwright chromium
  try {
    return await chromium.launch({ headless });
  } catch (e1) {
    // 2) system chrome channel
    try {
      return await chromium.launch({ headless, channel: 'chrome' });
    } catch (e2) {
      // 3) explicit executable candidates
      const errs = [String(e1.message || e1), String(e2.message || e2)];
      for (const exe of candidateExecutables()) {
        try {
          return await chromium.launch({ headless, executablePath: exe });
        } catch (e3) {
          errs.push(`${exe}: ${e3.message || e3}`);
        }
      }
      throw new Error(
        `Unable to launch browser. Run: npm run install-browser\n${errs.slice(0, 4).join('\n')}`
      );
    }
  }
}

export async function getBrowser() {
  const headless = String(getSetting('playwright_headless', 'true')) !== 'false';
  const key = String(headless);
  if (sharedBrowser && sharedBrowser.isConnected() && lastKey === key) {
    return sharedBrowser;
  }
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => {});
    sharedBrowser = null;
  }
  if (launching) return launching;

  launching = (async () => {
    lastHeadless = headless;
    lastKey = key;
    sharedBrowser = await launchBrowser(headless);
    sharedBrowser.on('disconnected', () => {
      if (sharedBrowser && !sharedBrowser.isConnected()) sharedBrowser = null;
    });
    return sharedBrowser;
  })();

  try {
    return await launching;
  } finally {
    launching = null;
  }
}

export async function newContext(timeout) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'zh-CN',
    viewport: { width: 1365, height: 900 },
  });
  context.setDefaultTimeout(timeout);
  return context;
}

export async function closeBrowser() {
  if (sharedBrowser) {
    await sharedBrowser.close().catch(() => {});
    sharedBrowser = null;
  }
}
