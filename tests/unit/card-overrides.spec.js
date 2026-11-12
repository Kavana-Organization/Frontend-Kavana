const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const CODEMOD_PATH = path.resolve('scripts/codemods/card-overrides.mjs');
const SRC_DIR = path.resolve('src');

function scanSourceFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanSourceFiles(full));
    } else if (/\.(js|jsx|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

test.describe('Task 5: Card Override Codemod Specifications', () => {
  test('1. Zero occurrences of ctp-surface0)/0.55 exist anywhere in src/', () => {
    const files = scanSourceFiles(SRC_DIR);
    expect(files.length).toBeGreaterThan(0);

    const occurrences = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/ctp-surface0\)\/0\.55/g);
      if (matches) {
        occurrences.push({
          file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
          count: matches.length,
        });
      }
    }

    expect(
      occurrences,
      `Expected zero occurrences of ctp-surface0)/0.55 in src/, but found hits in: ${JSON.stringify(occurrences)}`
    ).toEqual([]);
  });

  test('2. scripts/codemods/card-overrides.mjs exists and exports runCodemod and transformContent', async () => {
    expect(fs.existsSync(CODEMOD_PATH), 'scripts/codemods/card-overrides.mjs must exist').toBe(true);

    const mod = await import('../../scripts/codemods/card-overrides.mjs');
    expect(typeof mod.runCodemod, 'runCodemod must be an exported function').toBe('function');
    expect(typeof mod.transformContent, 'transformContent must be an exported function').toBe('function');
    expect(Array.isArray(mod.FROZEN_PATHS), 'FROZEN_PATHS must be an exported array').toBe(true);
  });

  test('3. scripts/codemods/card-overrides.mjs is idempotent (running it again produces 0 modified files)', async () => {
    const { runCodemod } = await import('../../scripts/codemods/card-overrides.mjs');

    // Run across src/
    const result = runCodemod('src');
    expect(result.modifiedFiles, 'Re-running codemod on clean src/ must produce 0 modified files').toEqual([]);
    expect(result.remainingHits, 'Remaining ctp-surface0)/0.55 hits must be 0').toBe(0);
  });

  test('4. Card components utilize variant="muted" and do not hard-code repeated surface overrides', () => {
    const files = scanSourceFiles(SRC_DIR);
    let mutedCardCount = 0;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/variant="muted"/g);
      if (matches) {
        mutedCardCount += matches.length;
      }

      // No <Card ...> should have ctp-surface0/0.55 override
      const cardWithOverride = content.match(/<Card\b[^>]*ctp-surface0\)\/0\.55/);
      expect(
        cardWithOverride,
        `File ${path.relative(process.cwd(), file)} contains <Card> with ctp-surface0)/0.55 override`
      ).toBeNull();
    }

    // Confirm that variant="muted" was applied across cards
    expect(mutedCardCount, 'Expected cards to adopt variant="muted" across dashboard pages').toBeGreaterThan(80);
  });

  test('5. Codemod preserves frozen files without touching them', async () => {
    const { transformContent, isFrozenPath } = await import('../../scripts/codemods/card-overrides.mjs');

    expect(isFrozenPath('src/lib/api.js')).toBe(true);
    expect(isFrozenPath('src/components/auth/auth-guard.jsx')).toBe(true);
    expect(isFrozenPath('src/store/auth-store.js')).toBe(true);

    const sampleContent = '<Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring">';
    const result = transformContent(sampleContent, 'src/components/auth/auth-guard.jsx');
    expect(result, 'Frozen path content must remain untouched').toBe(sampleContent);
  });

  test('6. Codemod does NOT span across tags or collapse lines between separate Button or Card elements', async () => {
    const { transformContent } = await import('../../scripts/codemods/card-overrides.mjs');

    const multiButtonSnippet = [
      '<div>',
      '  <Button className="ctp-focus rounded-2xl bg-[hsl(var(--ctp-blue)/0.20)] text-[hsl(var(--ctp-text))] hover:bg-[hsl(var(--ctp-blue)/0.28)] border border-[hsl(var(--ctp-blue)/0.30)]" variant="secondary">',
      '    Mulai',
      '  </Button>',
      '</div>',
      '<div>',
      '  <Button variant="secondary" className="ctp-focus h-9 rounded-2xl border border-[hsl(var(--ctp-overlay0)/0.35)] bg-[hsl(var(--ctp-surface0)/0.35)] hover:bg-[hsl(var(--ctp-surface0)/0.55)]">',
      '    Lihat semua',
      '  </Button>',
      '</div>'
    ].join('\n');

    const transformedButtons = transformContent(multiButtonSnippet, 'src/test.jsx');
    // Ensure Mulai button and its variant="secondary" are untouched
    expect(transformedButtons).toContain('Mulai');
    expect(transformedButtons).toContain('variant="secondary">\n    Mulai');
    // Ensure intermediate tags are not collapsed
    expect(transformedButtons).toContain('</div>\n<div>');
    // Ensure Lihat semua button receives size="sm" without collapsing lines
    expect(transformedButtons).toContain('<Button variant="secondary" size="sm">\n    Lihat semua');

    const multiCardSnippet = [
      '<Card className="p-4">',
      '  <p>First Card Content</p>',
      '</Card>',
      '<div>Intermediate content</div>',
      '<Card className="bg-[hsl(var(--ctp-surface0)/0.55)] border-[hsl(var(--ctp-overlay0)/0.45)] ctp-ring p-6">',
      '  <p>Second Card Content</p>',
      '</Card>'
    ].join('\n');

    const transformedCards = transformContent(multiCardSnippet, 'src/test.jsx');
    expect(transformedCards).toContain('<Card className="p-4">\n  <p>First Card Content</p>\n</Card>');
    expect(transformedCards).toContain('<div>Intermediate content</div>');
    expect(transformedCards).toContain('<Card variant="muted" className="p-6">\n  <p>Second Card Content</p>\n</Card>');
  });
});
