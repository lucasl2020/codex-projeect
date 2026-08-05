/**
 * One-click start entry: ensures deps optionally, starts server with port fallback.
 * Prefer start.bat on Windows (auto open browser).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...opts,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });
}

async function main() {
  if (!fs.existsSync(path.join(root, 'node_modules'))) {
    console.log('[start] installing dependencies...');
    await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
      'install',
      '--no-fund',
      '--no-audit',
    ]);
  }

  const db = path.join(root, 'data', 'app.db');
  const seed = path.join(root, 'data', 'seed-urls.txt');
  if (!fs.existsSync(db) && fs.existsSync(seed)) {
    console.log('[start] importing seed urls...');
    await run(process.execPath, [path.join(root, 'scripts', 'import-seed.js')]);
  }

  process.env.CARD_SHOP_OPEN = process.env.CARD_SHOP_OPEN || '1';
  // Hand off to index (port fallback inside)
  const child = spawn(process.execPath, [path.join(root, 'src', 'index.js')], {
    cwd: root,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  });

  let opened = false;
  const onLine = (line, isErr = false) => {
    const text = line.toString();
    if (isErr) process.stderr.write(text.endsWith('\n') ? text : text + '\n');
    else process.stdout.write(text.endsWith('\n') ? text : text + '\n');
    if (!opened) {
      const m = text.match(/Card Shop Manager\s+(https?:\/\/127\.0\.0\.1:\d+)/);
      if (m) {
        opened = true;
        const url = m[1];
        try {
          if (process.platform === 'win32') {
            spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true });
          } else if (process.platform === 'darwin') {
            spawn('open', [url], { stdio: 'ignore', detached: true });
          } else {
            spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
          }
          console.log(`[open] 已打开浏览器 ${url}`);
        } catch {
          console.log(`[open] 请手动打开 ${url}`);
        }
      }
    }
  };

  child.stdout.on('data', (buf) => {
    for (const line of buf.toString().split(/\r?\n/)) if (line) onLine(line, false);
  });
  child.stderr.on('data', (buf) => {
    for (const line of buf.toString().split(/\r?\n/)) if (line) onLine(line, true);
  });

  const shutdown = () => {
    if (!child.killed) child.kill('SIGINT');
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  child.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
