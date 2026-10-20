const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { stripHTML, unescapeHTML } = require('hexo-util');

const output = path.resolve('public');
const search = JSON.parse(fs.readFileSync(path.join(output, 'search.json'), 'utf8'));
const titles = {
  django: 'Django · Base',
  docker: 'Docker · Base',
  'docker-dockerfile': 'Docker · Dockerfile',
  'docker-compose': 'Docker Compose',
  redis: 'Redis · Base',
  'llm-week-1': 'LLM Engineering · Week 1',
  'llm-week-2': 'LLM Engineering · Week 2',
  'llm-week-3': 'LLM Engineering · Week 3',
  'python-asincronia': 'Python · Asincronía'
};
const expected = Object.keys(titles);
assert.deepEqual(
  search.map((sheet) => sheet.path).sort(),
  expected.map((slug) => `/${slug}.html`).sort()
);
const sourceFiles = fs.readdirSync('source/_posts').filter((file) => file.endsWith('.md'));
assert.deepEqual(sourceFiles.sort(), expected.map((slug) => `${slug}.md`).sort());
for (const sheet of search) {
  assert(sheet.title?.trim(), `Missing title: ${sheet.path}`);
  assert(sheet.path.startsWith('/'), `Search URL must be local: ${sheet.path}`);
  assert(fs.existsSync(path.join(output, sheet.path)), `Missing sheet: ${sheet.path}`);
  const slug = path.basename(sheet.path, '.html');
  const html = fs.readFileSync(path.join(output, sheet.path), 'utf8');
  const source = fs.readFileSync(`source/_posts/${slug}.md`, 'utf8');
  if (slug.startsWith('django')) {
    for (const token of source.matchAll(/{%[\s\S]*?%}|{{[\s\S]*?}}/g)) {
      assert(!token[0].includes('\n'), `A formatter split a Django template token: ${slug}`);
    }
  }
  assert(html.includes('css/learning.css'), `Missing reading styles: ${slug}`);
  assert(html.includes('learning-page-cards'), `Inconsistent layout: ${slug}`);
  assert.equal(sheet.title, titles[slug], `Incorrect guide title: ${slug}`);
  const headings = [...source.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  const rendered = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((match) =>
    unescapeHTML(stripHTML(match[1])).replace(/^#/, '')
  );
  assert.deepEqual(rendered, headings, `Missing or truncated topic sections: ${slug}`);
  assert(sheet.sections?.length === headings.length, `Incomplete search/contents index: ${slug}`);
  assert(
    !/MiniStore|Descargar laboratorio|Cómo trabajar con estos apuntes/.test(html),
    `Obsolete material: ${slug}`
  );
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => unescapeHTML(match[1])));
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = unescapeHTML(match[1]);
    if (href.startsWith('#') && href.length > 1) {
      assert(ids.has(decodeURIComponent(href.slice(1))), `Broken anchor in ${slug}: ${href}`);
    } else if (href.startsWith('/') && !href.startsWith('//')) {
      const url = new URL(href, 'https://app.sheet-codes.workers.dev');
      const relative = decodeURIComponent(url.pathname).slice(1);
      const target =
        relative.endsWith('/') || !relative ? path.join(relative, 'index.html') : relative;
      assert(fs.existsSync(path.join(output, target)), `Broken local link in ${slug}: ${href}`);
    }
  }
}
const homepage = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
assert(homepage.includes('Sheet Codes'));
// Category headings and grids must be siblings; nesting a new category in the
// previous grid squeezes its heading and card into individual grid columns.
const catalogueHtml = homepage.match(
  /<section\b[^>]*class="[^"]*\bcatalogue\b[^"]*"[^>]*>([\s\S]*?)<\/section>/
)?.[1];
assert(catalogueHtml, 'Missing homepage catalogue');
let catalogueDepth = 0;
let categoryDepth;
for (const [tag] of catalogueHtml.matchAll(/<\/?div\b[^>]*>|<h2\b[^>]*>/g)) {
  if (tag.startsWith('</div')) catalogueDepth -= 1;
  else if (tag.startsWith('<div')) {
    if (tag.includes('catalogue-grid'))
      assert.equal(catalogueDepth, categoryDepth, 'Catalogue grids must not be nested');
    catalogueDepth += 1;
  } else if (tag.includes('catalogue-heading')) {
    categoryDepth ??= catalogueDepth;
    assert.equal(
      catalogueDepth,
      categoryDepth,
      'Catalogue headings must not be inside another category'
    );
  }
}
assert.equal(catalogueDepth, 0, 'Unbalanced catalogue containers');
assert(
  !/<div\b[^>]*class="[^"]*catalogue-grid[^"]*"[^>]*>\s*<\/div>/.test(homepage),
  'Empty catalogue categories must not be displayed'
);
assert.equal(
  (homepage.match(/data-series-trigger/g) || []).length,
  4,
  'The four technology cards must retain their topic menus'
);
assert.deepEqual(
  [...catalogueHtml.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((match) =>
    stripHTML(match[1]).trim()
  ),
  ['Toolkit', 'Python', 'Database', 'AI', 'Custom'],
  'Custom must be a section heading alongside the other categories'
);
assert(!homepage.includes('series-custom'), 'Custom topics must link directly to their guides');
const customGrid = catalogueHtml.match(
  />Custom<\/h2>[\s\S]*?<div\b[^>]*catalogue-grid[^>]*>([\s\S]*)/
)?.[1];
assert(customGrid, 'Missing Custom topic cards');
const customLinks = [...customGrid.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
assert.deepEqual(
  customLinks.map((link) => [link[1], stripHTML(link[2]).trim()]),
  [['/python-asincronia.html', 'Asincronía']],
  'The Custom section must offer a direct Asincronía card'
);
const catalogue = {
  django: [['django', 'Base']],
  docker: [
    ['docker', 'Base'],
    ['docker-dockerfile', 'Dockerfile'],
    ['docker-compose', 'Docker Compose']
  ],
  redis: [['redis', 'Base']],
  llm: [
    ['llm-week-1', 'Week 1'],
    ['llm-week-2', 'Week 2'],
    ['llm-week-3', 'Week 3']
  ]
};
for (const [family, options] of Object.entries(catalogue)) {
  const dialog = [...homepage.matchAll(/<dialog\b[^>]*>[\s\S]*?<\/dialog>/g)].find((match) =>
    match[0].includes(`id="series-${family}"`)
  )?.[0];
  assert(dialog, `Missing topic menu: ${family}`);
  const links = [...dialog.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.deepEqual(
    links.map((link) => [link[1], stripHTML(link[2]).trim()]),
    options.map(([slug, label]) => [`/${slug}.html`, label]),
    `Incorrect topic options: ${family}`
  );
}
const obsoletePages = fs
  .readdirSync(output)
  .filter(
    (file) =>
      /^(django|docker|redis|llm)-.*\.html$/.test(file) &&
      !expected.includes(path.basename(file, '.html'))
  );
assert.deepEqual(obsoletePages, [], 'Removed subtopics must not remain in the build');
assert(
  fs.readFileSync(path.join(output, 'css/learning.css'), 'utf8').includes('.learning-page-cards')
);
assert(fs.existsSync(path.join(output, 'js/learning.js')));
const pythonGuide = fs.readFileSync(path.join(output, 'python-asincronia.html'), 'utf8');
assert(!/data-python-demo|python-labs|python-worker|pyodide/i.test(pythonGuide));
assert(/<h1\b[^>]*>Asincronía<\/h1>/.test(pythonGuide));
assert(pythonGuide.includes('href="/custom/"'));
assert(
  fs
    .readFileSync(path.join(output, 'custom/index.html'), 'utf8')
    .includes('/python-asincronia.html')
);
for (const removed of [
  'assets/python',
  'css/python-labs.css',
  'js/python-labs.js',
  'js/python-worker.js'
]) {
  assert(
    !fs.existsSync(path.join(output, removed)),
    `Obsolete runtime remains in the build: ${removed}`
  );
}
assert(fs.existsSync(path.join(output, 'site-version.json')));
assert(fs.existsSync(path.join(output, '404.html')), 'Pages needs a real 404 page');
for (const promotion of [
  'carbon_container',
  'adsbygoogle',
  'buymeacoffee',
  'fionaai',
  'referral.is',
  'github-stars'
]) {
  assert(!homepage.includes(promotion), `Promotional UI returned: ${promotion}`);
}
assert.equal(
  fs.readFileSync(path.join(output, 'LICENSE.txt'), 'utf8'),
  fs.readFileSync('LICENSE', 'utf8')
);
console.log(
  `Verified all ${search.length} guide routes, rendered sections, local links, shared layouts, catalogue and license.`
);
