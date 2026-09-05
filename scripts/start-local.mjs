import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Next's production build records the physical project path. Starting through
// the C: junction can produce invalid paths when the project lives on D:.
const project = realpathSync(join(dirname(fileURLToPath(import.meta.url)), '..'));
const url = 'http://127.0.0.1:3010';
const logs = join(process.env.LOCALAPPDATA || join(project, 'data'), 'MotionLayer', 'runtime');
mkdirSync(logs, { recursive: true });

async function isReady() {
  try {
    const response = await fetch(`${url}/api/graphics/provenance`, { signal: AbortSignal.timeout(1500) });
    return response.ok && (await response.json()).engine?.name === 'MotionLayer graphics';
  } catch {
    return false;
  }
}

async function main() {
  if (!(await isReady())) {
    if (!existsSync(join(project, '.next', 'BUILD_ID'))) {
      throw new Error('MotionLayer needs a production build. Run npm run build in the project first.');
    }
    const stdout = openSync(join(logs, 'server.stdout.log'), 'a');
    const stderr = openSync(join(logs, 'server.stderr.log'), 'a');
    let child;
    try {
      child = spawn(process.execPath, [join(project, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '3010'], {
        cwd: project,
        detached: true,
        windowsHide: true,
        stdio: ['ignore', stdout, stderr],
      });
    } finally {
      closeSync(stdout);
      closeSync(stderr);
    }
    let launchError;
    let exited = false;
    child.once('error', error => { launchError = error; });
    child.once('exit', () => { exited = true; });
    child.unref();
    const deadline = Date.now() + 30000;
    while (!(await isReady())) {
      if (launchError) throw launchError;
      if (exited || Date.now() >= deadline) throw new Error(`MotionLayer did not start. See ${join(logs, 'server.stderr.log')}`);
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }
  console.log(`MotionLayer is ready at ${url}`);
  if (!process.argv.includes('--no-open') && process.platform === 'win32') {
    const browser = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Start-Process '${url}/'`], {
      detached: true, windowsHide: true, stdio: 'ignore',
    });
    browser.on('error', error => console.error(`Open ${url} in your browser. ${error.message}`));
    browser.unref();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
