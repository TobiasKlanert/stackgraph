// Renders the README images from a production build: screenshots of the
// split view and the phone layout in both themes, and the logo in both
// themes (GitHub picks the variant matching the reader's theme).
//
//   npm run build
//   npm install --no-save playwright && npx playwright install chromium
//   node scripts/readme-screenshots.mjs
//
// Playwright stays out of package.json on purpose: it is only needed when
// the UI changes enough for the images to be redone.

import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url).pathname;
const dist = join(root, 'dist/stackgraph/browser');
const out = join(root, 'docs/images');

const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

/** Static server with the SPA fallback of nginx.conf: unknown paths get index.html. */
function serve() {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    let file = join(dist, path);
    let body;
    try {
      body = await readFile(file);
    } catch {
      file = join(dist, 'index.html');
      body = await readFile(file);
    }
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/** The mark from public/favicon.svg with fixed colours instead of the media query. */
async function writeLogos() {
  const source = await readFile(join(root, 'public/favicon.svg'), 'utf8');
  const shapes = source.match(/<(?:path|rect)\b[^>]*\/>/g).join('\n  ');
  const colours = {
    dark: { node: '#2dd4bf', edge: '#8b95a7' },
    light: { node: '#0f766e', edge: '#59616e' },
  };
  for (const [theme, c] of Object.entries(colours)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>.node{fill:${c.node}}.edge{fill:none;stroke:${c.edge};stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}</style>
  ${shapes}
</svg>
`;
    await writeFile(join(out, `logo-${theme}.svg`), svg);
  }
}

async function openGraph(page, base) {
  await page.goto(base);
  await page.getByRole('button', { name: 'Try it with an example' }).click();
  await page.locator('[data-node-id="api"]').waitFor();
  // Let the layout and fonts settle before the picture is taken.
  await page.waitForTimeout(600);
}

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/`;
await mkdir(out, { recursive: true });
await writeLogos();

const browser = await chromium.launch();
for (const theme of ['dark', 'light']) {
  // Split view with a service selected: graph, details and editor at once.
  const desktop = await browser.newPage({
    viewport: { width: 1280, height: 760 },
    deviceScaleFactor: 1.5,
    colorScheme: theme,
  });
  await openGraph(desktop, base);
  await desktop.locator('[data-node-id="api"]').click();
  await desktop.waitForTimeout(300);
  await desktop.screenshot({ path: join(out, `split-view-${theme}.png`) });
  await desktop.close();

  // Phone: the graph tab with the details sheet collapsed.
  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: theme,
  });
  await openGraph(phone, base);
  await phone.screenshot({ path: join(out, `phone-${theme}.png`) });
  await phone.close();
}
await browser.close();
server.close();
console.log(`README images written to ${out}`);
