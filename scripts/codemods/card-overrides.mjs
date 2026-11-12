import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const FROZEN_PATHS = [
  'src/lib/',
  'src/components/auth/auth-guard.jsx',
  'src/store/auth-store.js',
];

export function isFrozenPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return FROZEN_PATHS.some((frozen) => normalized.includes(frozen));
}

export function transformContent(content, filePath = '') {
  if (isFrozenPath(filePath)) {
    return content;
  }

  let next = content;

  // 1. Remove `const cardCls = ...` / `let cardCls = ...`
  // And replace `<Card className={cardCls}>` -> `<Card variant="muted">`
  // `<Card className={`${cardCls} ...`}>` -> `<Card variant="muted" className="...">`
  if (next.includes('cardCls')) {
    next = next.replace(
      /<Card\b((?:[^>]|=>)*?)className=\{\`\$\{cardCls\}\s*([^`]*)\`\}((?:[^>]|=>)*?(?<!=)>)/g,
      (match, pre, extra, post) => {
        const trimmed = extra.trim();
        const preTrimmed = pre.trim();
        const postContent = post.replace(/>$/, '').trim();
        const extraProps = [preTrimmed, postContent].filter(Boolean).join(' ');
        if (trimmed) {
          return `<Card variant="muted"${extraProps ? ` ${extraProps}` : ''} className="${trimmed}">`;
        }
        return `<Card variant="muted"${extraProps ? ` ${extraProps}` : ''}>`;
      }
    );
    next = next.replace(
      /<Card\b((?:[^>]|=>)*?)className=\{cardCls\}((?:[^>]|=>)*?(?<!=)>)/g,
      (match, pre, post) => {
        const preTrimmed = pre.trim();
        const postContent = post.replace(/>$/, '').trim();
        const extraProps = [preTrimmed, postContent].filter(Boolean).join(' ');
        return `<Card variant="muted"${extraProps ? ` ${extraProps}` : ''}>`;
      }
    );

    // Remove the declaration: const cardCls = ['"]...['"];
    next = next.replace(/^[ \t]*(?:const|let)\s+cardCls\s*=\s*['"][^'"]*ctp-surface0[^'"]*['"];?\r?\n/gm, '');
  }

  // 2. Specific complex Card expressions (revisi-sidang hasilSidang ternary)
  const hasilSidangCardPattern = /<Card\b((?:[^>]|=>)*?)className=\{\s*hasilSidang\s*\?\s*`([^`]*)`\s*:\s*['"]bg-\[hsl\(var\(--ctp-surface0\)\/0\.55\)\] border-\[hsl\(var\(--ctp-overlay0\)\/0\.45\)\] ctp-ring['"]\s*\}((?:[^>]|=>)*?(?<!=)>)/g;
  next = next.replace(hasilSidangCardPattern, (match, pre, truthyClass, post) => {
    const cleanTruthy = truthyClass.replace(/\s*ctp-ring/g, '').trim();
    const preTrimmed = pre.trim();
    const postContent = post.replace(/>$/, '').trim();
    const extraProps = [preTrimmed, postContent].filter(Boolean).join(' ');
    const propsPrefix = extraProps ? ` ${extraProps}` : '';
    return `<Card${propsPrefix}\n          variant={hasilSidang ? "default" : "muted"}\n          className={\n            hasilSidang\n              ? \`${cleanTruthy}\`\n              : undefined\n          }>`;
  });

  // 3. Card with template literal className:
  // Matches <Card ... className={`...`} ...> containing bg-[hsl(var(--ctp-surface0)/0.55)]
  next = next.replace(
    /(<Card\b(?:[^>]|=>)*?)className=\{`([^>]*?bg-\[hsl\(var\(--ctp-surface0\)\/0\.55\)\][^>]*?)`\}((?:[^>]|=>)*?(?<!=)>)/g,
    (match, cardStart, templateContent, cardEnd) => {
      let cleaned = templateContent
        .replace(/bg-\[hsl\(var\(--ctp-surface0\)\/0\.55\)\]\s*/g, '')
        .replace(/border-\[hsl\(var\(--ctp-overlay0\)\/0\.45\)\]\s*/g, '')
        .replace(/ctp-ring\s*/g, '')
        .replace(/hover:bg-\[hsl\(var\(--ctp-surface0\)\/0\.70\)\]\s*/g, '')
        .replace(/rounded-2xl\s*/g, '')
        .trim();

      const withVariant = cardStart.includes('variant=')
        ? cardStart
        : cardStart.replace(/<Card\b/, '<Card variant="muted"');

      if (!cleaned) {
        return `${withVariant.trimEnd()}${cardEnd}`;
      }
      return `${withVariant}className={\`${cleaned}\`}${cardEnd}`;
    }
  );

  // 4. Standard <Card ... className="..." ...>
  // Strictly prevent tag-spanning across '>'
  next = next.replace(
    /<Card\b((?:[^>]|=>)*?)className="([^"]*bg-\[hsl\(var\(--ctp-surface0\)\/0\.55\)\][^"]*)"((?:[^>]|=>)*?(?<!=)>)/g,
    (match, preProps, classContent, postProps) => {
      const classes = classContent.split(/\s+/).filter(Boolean);
      const retained = classes.filter((cls) => {
        if (cls === 'bg-[hsl(var(--ctp-surface0)/0.55)]') return false;
        if (cls === 'border-[hsl(var(--ctp-overlay0)/0.45)]') return false;
        if (cls === 'ctp-ring') return false;
        if (cls === 'hover:bg-[hsl(var(--ctp-surface0)/0.70)]') return false;
        if (cls === 'rounded-2xl') return false;
        if (cls.startsWith('backdrop-blur')) return false;
        return true;
      });

      const preTrimmed = preProps.trim();
      const postContent = postProps.replace(/>$/, '').trim();
      const allProps = [preTrimmed, postContent].filter(Boolean).join(' ');
      const hasVariant = /variant=/.test(allProps);
      const variantAttr = hasVariant ? '' : 'variant="muted"';

      if (retained.length === 0) {
        if (allProps) {
          return `<Card ${variantAttr} ${allProps}>`.replace(/\s+/g, ' ').replace(' >', '>');
        }
        return `<Card ${variantAttr}>`;
      }

      const newClassName = retained.join(' ');
      if (allProps) {
        return `<Card ${variantAttr} ${preTrimmed ? `${preTrimmed} ` : ''}className="${newClassName}"${postContent ? ` ${postContent}` : ''}>`
          .replace(/\s+/g, ' ')
          .replace(' >', '>');
      }
      return `<Card ${variantAttr} className="${newClassName}">`;
    }
  );

  // 5. Button secondary overrides that hardcode hover:bg-[hsl(var(--ctp-surface0)/0.55)]
  // Strictly avoid tag-spanning across separate JSX elements while allowing arrow functions.
  next = next.replace(
    /<Button\b((?:[^>]|=>)*?)className="([^"]*hover:bg-\[hsl\(var\(--ctp-surface0\)\/0\.55\)\][^"]*)"((?:[^>]|=>)*?(?<!=)>)/g,
    (match, preProps, classContent, postProps) => {
      const isH8 = classContent.includes('h-8');
      const isH9 = classContent.includes('h-9');
      const isXs = classContent.includes('text-xs') || isH8;

      const sizeAttr = isXs ? 'size="xs"' : isH9 ? 'size="sm"' : '';
      const preTrimmed = preProps.trim();
      const postContent = postProps.replace(/>$/, '').trim();
      let combined = [preTrimmed, sizeAttr, postContent].filter(Boolean).join(' ').replace(/\s+/g, ' ');
      if (!combined.includes('variant=')) {
        combined = `variant="secondary" ${combined}`.trim();
      }
      return `<Button ${combined}>`;
    }
  );

  // 6. Nested subpanels inside cards:
  // Non-<Card> nested containers (<div|section|article>) with border and mantle/surface0 background
  next = next.replace(
    /<(div|section|article)\b((?:[^>]|=>)*?)className="([^"]*(?:bg-\[hsl\(var\(--ctp-mantle\)\/[^\]]+\)|bg-\[hsl\(var\(--ctp-surface0\)\/[^\]]+\)\])[^"]*)"((?:[^>]|=>)*?(?<!=)>)/g,
    (match, tag, preProps, classContent, postProps) => {
      if (
        !classContent.includes('border') ||
        (!classContent.includes('ctp-mantle') && !classContent.includes('ctp-surface0')) ||
        classContent.includes('bg-[var(--surface-sunken)]') ||
        classContent.includes('border-[var(--line)]')
      ) {
        return match;
      }

      const classes = classContent.split(/\s+/).filter(Boolean);
      let hasReplaced = false;

      const retained = [];
      for (const cls of classes) {
        if (cls === 'rounded-2xl' || cls === 'rounded-xl') {
          hasReplaced = true;
          continue;
        }
        if (cls === 'border') {
          hasReplaced = true;
          continue;
        }
        if (
          cls.startsWith('border-[hsl(var(--ctp-overlay0)') ||
          cls.startsWith('border-[hsl(var(--ctp-surface1)')
        ) {
          hasReplaced = true;
          continue;
        }
        if (
          cls.startsWith('bg-[hsl(var(--ctp-mantle)') ||
          cls.startsWith('bg-[hsl(var(--ctp-surface0)')
        ) {
          hasReplaced = true;
          continue;
        }
        if (
          cls.startsWith('hover:bg-[hsl(var(--ctp-surface0)') ||
          cls.startsWith('hover:bg-[hsl(var(--ctp-mantle)')
        ) {
          hasReplaced = true;
          continue;
        }
        retained.push(cls);
      }

      if (!hasReplaced) return match;

      const preTrimmed = preProps.trim();
      const postContent = postProps.replace(/>$/, '').trim();
      const finalClasses = [
        'rounded-xl',
        'border',
        'border-[var(--line)]',
        'bg-[var(--surface-sunken)]',
        ...retained,
      ].join(' ');
      const extraProps = [preTrimmed, postContent].filter(Boolean).join(' ');
      return `<${tag}${extraProps ? ` ${extraProps}` : ''} className="${finalClasses}">`
        .replace(/\s+/g, ' ')
        .replace(' >', '>');
    }
  );

  return next;
}

function scanFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanFiles(full));
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

export function runCodemod(targetDir = 'src', dryRun = false) {
  const srcPath = path.resolve(targetDir);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Target directory does not exist: ${srcPath}`);
  }

  const files = scanFiles(srcPath);
  const modifiedFiles = [];
  let remainingHits = 0;

  for (const file of files) {
    const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
    if (isFrozenPath(relPath)) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');
    const transformed = transformContent(content, relPath);

    if (content !== transformed) {
      modifiedFiles.push(relPath);
      if (!dryRun) {
        fs.writeFileSync(file, transformed, 'utf8');
      }
    }

    const checkContent = dryRun ? transformed : fs.readFileSync(file, 'utf8');
    const matches = checkContent.match(/ctp-surface0\)\/0\.55/g);
    if (matches) {
      remainingHits += matches.length;
    }
  }

  return {
    modifiedFiles,
    remainingHits,
  };
}

// CLI execution
const currentFile = fileURLToPath(import.meta.url).replace(/\\/g, '/');
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]).replace(/\\/g, '/') : '';

if (invokedFile && (currentFile === invokedFile || invokedFile.endsWith('card-overrides.mjs'))) {
  console.log('[card-overrides] Executing card override codemod across src/...');
  const result = runCodemod('src');
  console.log(`[card-overrides] Modified files: ${result.modifiedFiles.length}`);
  for (const file of result.modifiedFiles) {
    console.log(`  - ${file}`);
  }
  console.log(`[card-overrides] Remaining ctp-surface0/0.55 occurrences: ${result.remainingHits}`);
  if (result.remainingHits > 0) {
    console.error(`[card-overrides] FAILED: ${result.remainingHits} occurrences remain.`);
    process.exit(1);
  }
  console.log('[card-overrides] Codemod completed successfully with zero remaining hits.');
}
