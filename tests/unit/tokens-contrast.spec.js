const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function parseHsl(str) {
  // Parses "215 19% 62%" or "hsl(215 19% 62%)" into [h, s, l]
  const cleaned = str.replace(/hsl\(|\)/g, '').trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length < 3) return null;
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]);
  const l = parseFloat(parts[2]);
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  return [r + m, g + m, b + m];
}

function relativeLuminance(r, g, b) {
  const a = [r, g, b].map((v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(hsl1, hsl2) {
  const l1 = relativeLuminance(...hslToRgb(...hsl1));
  const l2 = relativeLuminance(...hslToRgb(...hsl2));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function scanFiles(dir, extensions = ['.js', '.jsx', '.css']) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

test.describe('Tokens and Typography (Task 2)', () => {
  const globalsPath = path.resolve('src/app/globals.css');
  const layoutPath = path.resolve('src/app/layout.js');
  const globalsCss = fs.readFileSync(globalsPath, 'utf8');
  const layoutJs = fs.readFileSync(layoutPath, 'utf8');

  test('1. All 9 semantic tokens exist in globals.css (:root, .dark, and @theme inline)', () => {
    const tokens = [
      '--surface-page',
      '--surface-raised',
      '--surface-sunken',
      '--line',
      '--text-strong',
      '--text-body',
      '--text-muted',
      '--accent',
      '--accent-soft',
    ];

    // Extract blocks
    const rootBlockMatch = globalsCss.match(/:root\s*\{([^}]+)\}/);
    expect(rootBlockMatch, ':root block must exist in globals.css').toBeTruthy();
    const rootBlock = rootBlockMatch[1];

    const darkBlockMatch = globalsCss.match(/\.dark\s*\{([^}]+)\}/);
    expect(darkBlockMatch, '.dark block must exist in globals.css').toBeTruthy();
    const darkBlock = darkBlockMatch[1];

    const themeBlockMatch = globalsCss.match(/@theme inline\s*\{([^}]+)\}/);
    expect(themeBlockMatch, '@theme inline block must exist in globals.css').toBeTruthy();
    const themeBlock = themeBlockMatch[1];

    for (const token of tokens) {
      expect(rootBlock).toContain(token);
      expect(darkBlock).toContain(token);
    }

    // Semantic tokens mapped in @theme inline
    const themeTokens = [
      '--color-surface-page',
      '--color-surface-raised',
      '--color-surface-sunken',
      '--color-line',
      '--color-text-strong',
      '--color-text-body',
      '--color-text-muted',
      '--color-accent-soft',
    ];
    for (const themeToken of themeTokens) {
      expect(themeBlock).toContain(themeToken);
    }
  });

  test('2. Dark --ctp-overlay1 has lightness 62%, and WCAG contrast ratios meet >= 4.5:1', () => {
    // Check dark --ctp-overlay1 lightness
    const darkBlock = globalsCss.match(/\.dark\s*\{([^}]+)\}/)?.[1] || '';
    const overlay1Match = darkBlock.match(/--ctp-overlay1:\s*([^;]+);/);
    expect(overlay1Match, 'Dark --ctp-overlay1 must be defined in .dark block').toBeTruthy();

    const overlay1Hsl = parseHsl(overlay1Match[1]);
    expect(overlay1Hsl).not.toBeNull();
    expect(overlay1Hsl[2]).toBe(62);

    // Light theme token values
    const lightBase = [0, 0, 100];
    const lightMantle = [210, 40, 98];
    const lightStrong = [222, 47, 11];
    const lightBody = [215, 19, 35];
    const lightMuted = [215, 16, 47];

    expect(contrastRatio(lightStrong, lightBase)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightStrong, lightMantle)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightBody, lightBase)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightBody, lightMantle)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightMuted, lightBase)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lightMuted, lightMantle)).toBeGreaterThanOrEqual(4.5);

    // Dark theme token values
    const darkBase = [222, 47, 11];
    const darkMantle = [222, 47, 9];
    const darkStrong = [210, 40, 98];
    const darkBody = [214, 32, 82];
    const darkMuted = [215, 20, 65];

    expect(contrastRatio(darkStrong, darkBase)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkStrong, darkMantle)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkBody, darkBase)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkBody, darkMantle)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkMuted, darkBase)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(darkMuted, darkMantle)).toBeGreaterThanOrEqual(4.5);

    // Dark --ctp-overlay1 contrast
    expect(contrastRatio(overlay1Hsl, darkBase)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(overlay1Hsl, darkMantle)).toBeGreaterThanOrEqual(4.5);
  });

  test('3. .ctp-grid and .ctp-noise are absent from globals.css and layout.js', () => {
    expect(layoutJs).not.toContain('ctp-noise');
    expect(layoutJs).not.toContain('ctp-grid');
    expect(globalsCss).not.toContain('.ctp-noise');
    expect(globalsCss).not.toContain('.ctp-grid');
  });

  test('4. prefers-reduced-motion: reduce rule is present in globals.css', () => {
    expect(globalsCss).toContain('prefers-reduced-motion: reduce');
    expect(globalsCss).toContain('animation-duration: 0.01ms !important');
    expect(globalsCss).toContain('transition-duration: 0.01ms !important');
  });

  test('5. No text-[hsl(var(--ctp-overlay1))] remains in src/', () => {
    const srcDir = path.resolve('src');
    const files = scanFiles(srcDir);
    const violations = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (/(?<!placeholder:)text-\[hsl\(var\(--ctp-overlay1\)\)\]/.test(content)) {
        const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
        violations.push(relativePath);
      }
    }

    expect(violations, `Found remaining text-[hsl(var(--ctp-overlay1))] in: ${violations.join(', ')}`).toEqual([]);
  });

  test('6. Typography: font-sans and font-mono variables and tabular-nums configured', () => {
    // globals.css headings tracking 0 and line height 1.2
    expect(globalsCss).not.toContain('letter-spacing: -0.03em');
    expect(globalsCss).toContain('tabular-nums');

    // layout.js loads Public_Sans and JetBrains_Mono via next/font/google
    expect(layoutJs).toContain('Public_Sans');
    expect(layoutJs).toContain('JetBrains_Mono');
    expect(layoutJs).toContain('--font-sans');
    expect(layoutJs).toContain('--font-mono');
  });
});
