import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const STRICTLY_FROZEN = [
  'src/lib/alert.js',
  'src/lib/api.js',
  'src/lib/auth-tracker.js',
  'src/lib/realtime.js',
  'src/lib/utils.js',
  'src/lib/validation.js',
  'src/lib/validators.js',
  'src/store/auth-store.js',
];

function getBaseRef() {
  try {
    execSync('git rev-parse --verify origin/main', { stdio: 'pipe' });
    return 'origin/main';
  } catch {
    try {
      execSync('git rev-parse --verify main', { stdio: 'pipe' });
      return 'main';
    } catch {
      return 'HEAD';
    }
  }
}

function getChangedFiles(baseRef) {
  try {
    const output = execSync(`git diff --name-only ${baseRef}`, { encoding: 'utf8' });
    return output
      .split('\n')
      .map((line) => line.trim().replace(/\\/g, '/'))
      .filter(Boolean);
  } catch (err) {
    console.error('Failed to get git diff:', err.message);
    process.exit(1);
  }
}

function getFileFromGit(ref, filePath) {
  try {
    const gitPath = filePath.replace(/\\/g, '/');
    return execSync(`git show ${ref}:${gitPath}`, { encoding: 'utf8' }).replace(/\r\n/g, '\n');
  } catch {
    return null;
  }
}

function normalizeText(str) {
  return (str || '').replace(/\r\n/g, '\n').trim();
}

function extractEffect(content) {
  const match = content.match(/useEffect\(\(\)\s*=>\s*\{[\s\S]*?\}, \[[^\]]*\]\);/);
  return match ? normalizeText(match[0]) : null;
}

function extractExportObject(content, name) {
  const match = content.match(new RegExp(`export\\s+const\\s+${name}\\s*=\\s*(\\{[\\s\\S]*?\\n\\};)`));
  return match ? normalizeText(match[1]) : null;
}

function main() {
  console.log('[ui-guard] Checking frozen paths against git origin/main...');
  const baseRef = getBaseRef();
  console.log(`[ui-guard] Using base ref: ${baseRef}`);

  const changedFiles = getChangedFiles(baseRef);
  const violations = [];

  // 1. Strictly frozen paths
  for (const frozen of STRICTLY_FROZEN) {
    if (changedFiles.includes(frozen)) {
      violations.push(`STRICTLY FROZEN file modified: ${frozen}`);
    }
  }

  // 2. AuthGuard check
  const authGuardPath = 'src/components/auth/auth-guard.jsx';
  if (changedFiles.includes(authGuardPath)) {
    const originContent = getFileFromGit(baseRef, authGuardPath);
    const currentContent = fs.existsSync(authGuardPath)
      ? fs.readFileSync(authGuardPath, 'utf8').replace(/\r\n/g, '\n')
      : null;

    if (!originContent || !currentContent) {
      violations.push(`Cannot compare ${authGuardPath}`);
    } else {
      const originEffect = extractEffect(originContent);
      const currentEffect = extractEffect(currentContent);

      if (originEffect !== currentEffect) {
        violations.push(
          `${authGuardPath}: useEffect hook block has been modified from ${baseRef}. Auth logic must remain byte-for-byte identical.`
        );
      }

      const guardCondition = "if (!token && typeof window !== 'undefined' && !sessionStorage.getItem('authToken'))";
      if (!currentContent.includes(guardCondition)) {
        violations.push(
          `${authGuardPath}: Guard condition expression was altered or removed. Must contain exact check: ${guardCondition}`
        );
      }
    }
  }

  // 3. Constants check
  const constantsPath = 'src/lib/constants.js';
  if (changedFiles.includes(constantsPath)) {
    const originConstants = getFileFromGit(baseRef, constantsPath);
    const currentConstants = fs.existsSync(constantsPath)
      ? fs.readFileSync(constantsPath, 'utf8').replace(/\r\n/g, '\n')
      : null;

    if (!originConstants || !currentConstants) {
      violations.push(`Cannot compare ${constantsPath}`);
    } else {
      const exportsToCheck = ['MENU_CONFIG', 'ROLE_LABEL', 'ROLE_DASHBOARD_ROUTE'];
      for (const exp of exportsToCheck) {
        const originExp = extractExportObject(originConstants, exp);
        const currentExp = extractExportObject(currentConstants, exp);

        if (!originExp || !currentExp) {
          violations.push(`${constantsPath}: Could not extract export ${exp} for verification`);
        } else if (originExp !== currentExp) {
          violations.push(
            `${constantsPath}: Export ${exp} has been modified relative to ${baseRef}. Core role/menu exports must be byte-for-byte identical.`
          );
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('\n[ui-guard] VIOLATIONS DETECTED:');
    for (const v of violations) {
      console.error(`  - ${v}`);
    }
    console.error('\n[ui-guard] Aborting. Please revert modifications to frozen files.\n');
    process.exit(1);
  }

  console.log('[ui-guard] All frozen path checks passed.');
}

main();

