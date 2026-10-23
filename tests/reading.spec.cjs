const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const guides = JSON.parse(fs.readFileSync('public/search.json', 'utf8'));

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
}
async function accessible(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map((n) => ({ target: n.target, summary: n.failureSummary }))
    }))
  ).toEqual([]);
}

test('every guide preserves its content, article index, contrast and viewport', async ({
  page
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const guide of guides) {
    await page.goto(guide.path);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(page.locator('.learning-on-page nav a')).toHaveCount(guide.sections.length);
    await expect(page.locator('.study-sidebar, .study-navigation')).toHaveCount(0);
    await expect(page.locator('.learning-breadcrumb a[href="/"]')).toBeVisible();
    await noOverflow(page);
    await accessible(page);
  }
  expect(errors).toEqual([]);
});

test('catalogue menus close outside or with Escape and restore focus without a close button', async ({
  page
}) => {
  await page.goto('/');
  await expect(page.locator('.study-sidebar, .study-navigation')).toHaveCount(0);
  await noOverflow(page);
  await accessible(page);
  for (const id of ['docker', 'django', 'redis', 'llm']) {
    const trigger = page.locator(`[data-series-trigger="${id}"]`);
    await trigger.click();
    const dialog = page.locator(`#series-${id}`);
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('button')).toHaveCount(0);
    await expect(dialog.locator('.series-options a').first()).toBeFocused();
    await accessible(page);
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.locator('.series-options a').last()).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.locator('.series-options a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await dialog.locator('h2').click();
    await expect(dialog).toBeVisible();
    await page.mouse.click(4, 4);
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
  await page.locator('[data-series-trigger="docker"]').click();
  await page.locator('#series-docker a[href="/docker-dockerfile.html"]').click();
  await expect(page).toHaveURL(/docker-dockerfile/);
  await page.goBack();
  await expect(page.locator('dialog.series-dialog[open]')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/series-is-open/);
  await page.locator('.catalogue-grid a[href="/sistemas-agenticos.html"]').click();
  await expect(page).toHaveURL(/sistemas-agenticos/);
  await page.goto('/custom/');
  await expect(page.locator('.custom-guides a')).toHaveCount(2);
  await accessible(page);
});

test('search handles accents, empty results, clear, preview and keyboard navigation', async ({
  page
}) => {
  await page.goto('/sistemas-agenticos.html#el-bucle-y-sus-mensajes');
  await page.locator('#mysearch-trigger').click();
  const input = page.locator('#mysearch-input');
  await input.fill('agenticos');
  await expect(page.locator('#mysearch-status')).toHaveText('1 guía encontrada');
  await expect(page.locator('#mysearch-list a')).toHaveCount(1);
  await expect(page).toHaveURL(/#el-bucle-y-sus-mensajes$/);
  await accessible(page);
  await input.fill('zzsincoincidencias9988');
  await expect(page.locator('#mysearch-status')).toContainText('No hay resultados');
  await expect(page.locator('.preview-panel')).toBeEmpty();
  await page.locator('#mysearch-clear').click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(page.locator('#mysearch-list a')).toHaveCount(10);
  await expect(page.locator('#mysearch-clear')).toBeHidden();
  await input.fill('asincronia');
  await expect(page.locator('#mysearch-status')).toHaveText('1 guía encontrada');
  await input.press('Enter');
  await expect(page).toHaveURL(/python-asincronia/);
  await page.keyboard.press('Control+k');
  await expect(input).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mysearch')).toBeHidden();
});

test('search recovers from a failed request and keeps the newest query', async ({ page }) => {
  let fail = true;
  await page.route('**/search.json*', async (route) => {
    if (fail) await route.fulfill({ status: 503, body: 'Unavailable' });
    else {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.continue();
    }
  });
  await page.goto('/');
  await page.locator('#mysearch-trigger').click();
  await expect(page.locator('#mysearch-status')).toContainText('No se pudieron cargar');
  await expect(page.locator('#mysearch-retry')).toBeVisible();
  await accessible(page);
  fail = false;
  await page.locator('#mysearch-retry').click();
  await page.locator('#mysearch-input').fill('Docker');
  await page.locator('#mysearch-input').fill('Sistemas agénticos');
  await expect(page.locator('#mysearch-status')).toHaveText('1 guía encontrada');
  await expect(page.locator('#mysearch-list')).toContainText('Sistemas agénticos');
});

test('theme persists and remains usable when storage is unavailable', async ({ page, context }) => {
  await page.goto('/sistemas-agenticos.html');
  const initial = await page.locator('html').evaluate((el) => el.classList.contains('dark'));
  await page.locator('#darkMode').click();
  await page.reload();
  expect(await page.locator('html').evaluate((el) => el.classList.contains('dark'))).toBe(!initial);
  await context.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage unavailable');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Storage unavailable');
    };
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload();
  await page.locator('#darkMode').click();
  await expect(page.locator('main h1')).toBeVisible();
  expect(errors).toEqual([]);
});

test('page index reaches headings below the header and follows manual scrolling', async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/sistemas-agenticos.html');
  const details = page.locator('.learning-on-page');
  if (!(await details.evaluate((el) => el.open))) await details.locator('summary').click();
  const link = details.locator('a[href="#memoria-y-recuperacion-de-conocimiento"]');
  await link.click();
  await expect(link).toHaveAttribute('aria-current', 'location');
  const heading = page.locator('#memoria-y-recuperacion-de-conocimiento');
  await expect(heading).toBeFocused();
  expect((await heading.boundingBox()).y).toBeGreaterThanOrEqual(64);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(details.locator('a[aria-current="location"]')).toHaveText('Referencias');
  await noOverflow(page);
});

test('code copying and its error fallback give accessible feedback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/sistemas-agenticos.html');
  await page.getByRole('button', { name: 'Copiar bloque de código' }).first().click();
  await expect(page.locator('.learning-copy-status')).toHaveText('Código copiado al portapapeles.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('call_1');
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new Error('Denied');
    };
  });
  await page.getByRole('button', { name: 'Copiar bloque de código' }).first().click();
  await expect(page.locator('.learning-copy-status')).toContainText('No se pudo copiar');
  expect(await page.evaluate(() => window.getSelection().toString())).toContain('call_1');
});

test('share actions and navigation through the homepage remain reachable', async ({ page }) => {
  await page.goto('/sistemas-agenticos.html');
  await page.locator('#share-trigger').click();
  await expect(page.getByRole('button', { name: 'Copiar enlace', exact: true })).toBeVisible();
  await accessible(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('#share-trigger')).toBeFocused();
  await page.getByRole('link', { name: 'Sheet Codes · Inicio' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.locator('.catalogue a[href="/python-asincronia.html"]').click();
  await expect(page.locator('main h1')).toHaveText('Asincronía');
});
