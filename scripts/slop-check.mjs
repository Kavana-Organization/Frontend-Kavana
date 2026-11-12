import fs from 'node:fs';
import path from 'node:path';

const BANNED_PATTERNS = [
  { id: 'backdrop-blur', regex: /backdrop-blur/g, label: 'backdrop-blur' },
  { id: 'rounded-[', regex: /rounded-\[/g, label: 'rounded-[' },
  { id: 'font-black', regex: /font-black/g, label: 'font-black' },
  { id: 'bg-gradient-to-', regex: /bg-gradient-to-/g, label: 'bg-gradient-to-' },
  { id: 'ctp-grid', regex: /ctp-grid/g, label: 'ctp-grid' },
  { id: 'ctp-noise', regex: /ctp-noise/g, label: 'ctp-noise' },
  { id: 'hover:-translate-y', regex: /hover:-translate-y/g, label: 'hover:-translate-y' },
  { id: 'shadow-[0_', regex: /shadow-\[0_/g, label: 'shadow-[0_' },
  { id: 'Ringkasan Halaman', regex: /Ringkasan Halaman/g, label: 'Ringkasan Halaman' },
];

const ALLOWED_BACKDROP_BLUR = [
  path.normalize('src/components/ui/dialog.jsx'),
  path.normalize('src/components/ui/sheet.jsx'),
  path.normalize('src/components/ui/alert-dialog.jsx'),
];

function isAllowedFile(filePath, patternId) {
  if (patternId === 'backdrop-blur') {
    const normalized = path.normalize(filePath);
    return ALLOWED_BACKDROP_BLUR.some((allowed) => normalized.endsWith(allowed));
  }
  return false;
}

function scanDirectory(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanDirectory(fullPath));
    } else if (/\.(js|jsx|css)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function main() {
  const args = process.argv.slice(2);
  const allowNonZero = args.includes('--baseline') || args.includes('--report');

  let maxHits = null;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--max-hits=')) {
      maxHits = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--max-hits' && args[i + 1]) {
      maxHits = parseInt(args[i + 1], 10);
    }
  }

  const srcDir = path.resolve('src');
  if (!fs.existsSync(srcDir)) {
    console.error('Directory src/ not found.');
    process.exit(1);
  }

  const files = scanDirectory(srcDir);
  const patternCounts = Object.fromEntries(BANNED_PATTERNS.map((p) => [p.label, 0]));
  const fileHits = [];
  let totalHits = 0;

  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    const fileMatches = [];

    for (const pattern of BANNED_PATTERNS) {
      if (isAllowedFile(file, pattern.id)) {
        continue;
      }

      let count = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.match(pattern.regex);
        if (matches) {
          count += matches.length;
          fileMatches.push({
            pattern: pattern.label,
            line: i + 1,
            count: matches.length,
            snippet: line.trim().slice(0, 80),
          });
        }
      }

      if (count > 0) {
        patternCounts[pattern.label] += count;
        totalHits += count;
      }
    }

    if (fileMatches.length > 0) {
      fileHits.push({ file: relativePath, matches: fileMatches });
    }
  }

  console.log('=== SLOP CHECK SUMMARY ===');
  console.log('Pattern counts:');
  for (const [pattern, count] of Object.entries(patternCounts)) {
    console.log(`  ${pattern.padEnd(22)}: ${count}`);
  }
  console.log('---------------------------');
  console.log(`Total slop hits: ${totalHits}`);
  console.log(`Files with hits: ${fileHits.length}`);

  if (fileHits.length > 0) {
    console.log('\nDetailed Breakdown:');
    for (const item of fileHits) {
      console.log(`  ${item.file} (${item.matches.reduce((acc, m) => acc + m.count, 0)} hits):`);
      for (const m of item.matches) {
        console.log(`    L${m.line} [${m.pattern}]: ${m.snippet}`);
      }
    }
  }

  if (maxHits !== null) {
    if (totalHits > maxHits) {
      console.error(`\n[slop-check] FAILED: Found ${totalHits} slop pattern hits in src/ (exceeds threshold of ${maxHits})`);
      process.exit(1);
    } else {
      console.log(`\n[slop-check] PASSED: Found ${totalHits} slop pattern hits in src/ (within threshold of ${maxHits}).`);
      process.exit(0);
    }
  }

  if (totalHits > 0) {
    if (allowNonZero) {
      console.log(`\n[slop-check] Completed in report mode. Starting baseline slop count is ${totalHits}.`);
      process.exit(0);
    } else {
      console.error(`\n[slop-check] FAILED: Found ${totalHits} slop pattern hits in src/`);
      process.exit(1);
    }
  }

  console.log('\n[slop-check] All clean! No slop patterns found.');
  process.exit(0);
}

main();

