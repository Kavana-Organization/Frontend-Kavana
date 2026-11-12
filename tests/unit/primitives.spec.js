const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const PRIMITIVE_FILES = [
  'button.jsx',
  'input.jsx',
  'textarea.jsx',
  'select.jsx',
  'card.jsx',
  'badge.jsx',
  'table.jsx',
  'tabs.jsx',
  'dialog.jsx',
  'dropdown-menu.jsx',
  'sheet.jsx',
  'sonner.jsx',
  'tooltip.jsx',
  'progress.jsx',
  'accordion.jsx',
];

const UI_DIR = path.resolve('src/components/ui');
const GLOBALS_CSS_PATH = path.resolve('src/app/globals.css');

test.describe('Task 3: Primitive Restyle Specifications', () => {
  test('1. All 15 primitive files exist and contain no arbitrary rounded-[, hover:-translate-y, or shadow-[0_', () => {
    for (const filename of PRIMITIVE_FILES) {
      const filePath = path.join(UI_DIR, filename);
      expect(fs.existsSync(filePath), `Primitive file ${filename} must exist`).toBe(true);

      const content = fs.readFileSync(filePath, 'utf8');

      // Check arbitrary rounded-[
      const roundedMatch = content.match(/rounded-\[/g);
      expect(roundedMatch, `File ${filename} must not contain arbitrary rounded-[`).toBeNull();

      // Check hover:-translate-y
      const hoverLiftMatch = content.match(/hover:-translate-y/g);
      expect(hoverLiftMatch, `File ${filename} must not contain hover:-translate-y lift`).toBeNull();

      // Check shadow-[0_
      const arbitraryShadowMatch = content.match(/shadow-\[0_/g);
      expect(arbitraryShadowMatch, `File ${filename} must not contain arbitrary shadow-[0_`).toBeNull();

      // Check backdrop-blur outside dialog/sheet overlay
      const blurMatches = content.match(/backdrop-blur/g);
      if (blurMatches) {
        const isDialogOrSheet = filename === 'dialog.jsx' || filename === 'sheet.jsx';
        expect(isDialogOrSheet, `File ${filename} must not contain backdrop-blur`).toBe(true);
      }
    }
  });

  test('2. Card component supports variant (default, muted, flat), 12px radius, line border, and 20px padding', () => {
    const cardContent = fs.readFileSync(path.join(UI_DIR, 'card.jsx'), 'utf8');
    expect(cardContent).toContain('variant');
    expect(cardContent).toContain('default');
    expect(cardContent).toContain('muted');
    expect(cardContent).toContain('flat');
    expect(cardContent).toContain('rounded-xl');
    expect(cardContent).toContain('border-[var(--line)]');
    expect(cardContent).toContain('shadow-none');
    // 20px padding (p-5 / px-5 / py-5)
    expect(cardContent).toMatch(/p(x|y)?-5/);

    // Check exports
    expect(cardContent).toContain('export {');
    expect(cardContent).toContain('Card,');
    expect(cardContent).toContain('CardHeader,');
    expect(cardContent).toContain('CardFooter,');
    expect(cardContent).toContain('CardTitle,');
    expect(cardContent).toContain('CardAction,');
    expect(cardContent).toContain('CardDescription,');
    expect(cardContent).toContain('CardContent');
  });

  test('3. Table component supports stackOnMobile, sunken header, 48px rows, and .table-stack utility in globals.css', () => {
    const tableContent = fs.readFileSync(path.join(UI_DIR, 'table.jsx'), 'utf8');
    expect(tableContent).toContain('stackOnMobile');
    expect(tableContent).toContain('table-stack');
    // Sunken header
    expect(tableContent).toContain('var(--surface-sunken)');
    // 48px row height
    expect(tableContent).toContain('h-12');
    expect(tableContent).toContain('min-h-12');
    // Edge-fade / scroll container
    expect(tableContent).toContain('overflow-x-auto');

    // globals.css table-stack check
    const globalsCss = fs.readFileSync(GLOBALS_CSS_PATH, 'utf8');
    expect(globalsCss).toContain('.table-stack');
    expect(globalsCss).toContain('@media (max-width: 639px)');
    expect(globalsCss).toContain('data-label');
  });

  test('4. Controls (Button, Input, Select) define default 40px height (h-10) and coarse pointer 44px min-height (min-h-11)', () => {
    const buttonContent = fs.readFileSync(path.join(UI_DIR, 'button.jsx'), 'utf8');
    expect(buttonContent).toContain('rounded-lg');
    expect(buttonContent).toContain('h-10');
    expect(buttonContent).toContain('[@media(pointer:coarse)]:min-h-11');
    expect(buttonContent).toContain('[@media(pointer:coarse)]:min-w-11');
    expect(buttonContent).not.toContain('hover:-translate-y-0.5');

    const inputContent = fs.readFileSync(path.join(UI_DIR, 'input.jsx'), 'utf8');
    expect(inputContent).toContain('rounded-lg');
    expect(inputContent).toContain('h-10');
    expect(inputContent).toContain('[@media(pointer:coarse)]:min-h-11');
    expect(inputContent).toContain('border-[var(--line)]');
    expect(inputContent).toContain('bg-[var(--surface-raised)]');

    const selectContent = fs.readFileSync(path.join(UI_DIR, 'select.jsx'), 'utf8');
    expect(selectContent).toContain('rounded-lg');
    expect(selectContent).toContain('h-10');
    expect(selectContent).toContain('[@media(pointer:coarse)]:min-h-11');
    expect(selectContent).toContain('border-[var(--line)]');
    expect(selectContent).toContain('bg-[var(--surface-raised)]');
  });

  test('5. Accordion exists, exports required components, uses 12px radius, line border, and 150ms transition', () => {
    const accordionContent = fs.readFileSync(path.join(UI_DIR, 'accordion.jsx'), 'utf8');
    expect(accordionContent).toContain('Accordion,');
    expect(accordionContent).toContain('AccordionItem,');
    expect(accordionContent).toContain('AccordionTrigger,');
    expect(accordionContent).toContain('AccordionContent');
    expect(accordionContent).toContain('rounded-xl');
    expect(accordionContent).toContain('border-[var(--line)]');
    expect(accordionContent).toContain('duration-150');
  });

  test('6. Overlay shadow (--shadow-overlay) defined in globals.css and used by overlay primitives', () => {
    const globalsCss = fs.readFileSync(GLOBALS_CSS_PATH, 'utf8');
    expect(globalsCss).toContain('--shadow-overlay');
    expect(globalsCss).toContain('0 8px 24px hsl(222 47% 11% / 0.12)');

    const dialogContent = fs.readFileSync(path.join(UI_DIR, 'dialog.jsx'), 'utf8');
    expect(dialogContent).toContain('shadow-overlay');
    expect(dialogContent).toContain('rounded-xl');

    const dropdownContent = fs.readFileSync(path.join(UI_DIR, 'dropdown-menu.jsx'), 'utf8');
    expect(dropdownContent).toContain('shadow-overlay');
    expect(dropdownContent).toContain('rounded-xl');

    const sheetContent = fs.readFileSync(path.join(UI_DIR, 'sheet.jsx'), 'utf8');
    expect(sheetContent).toContain('shadow-overlay');

    const tooltipContent = fs.readFileSync(path.join(UI_DIR, 'tooltip.jsx'), 'utf8');
    expect(tooltipContent).toContain('shadow-overlay');
    expect(tooltipContent).toContain('rounded-xl');

    const selectContent = fs.readFileSync(path.join(UI_DIR, 'select.jsx'), 'utf8');
    expect(selectContent).toContain('shadow-overlay');
    expect(selectContent).toContain('rounded-xl');
  });

  test('7. Sonner toast uses 12px radius, line border, shadow-overlay, and left status border rules', () => {
    const sonnerContent = fs.readFileSync(path.join(UI_DIR, 'sonner.jsx'), 'utf8');
    expect(sonnerContent).toContain('rounded-xl');
    expect(sonnerContent).toContain('border-[var(--line)]');
    expect(sonnerContent).toContain('shadow-overlay');
    expect(sonnerContent).toContain('border-l-4');
  });

  test('8. Badge uses rounded-md by default and supports counter variant with rounded-full', () => {
    const badgeContent = fs.readFileSync(path.join(UI_DIR, 'badge.jsx'), 'utf8');
    expect(badgeContent).toContain('rounded-md');
    expect(badgeContent).toContain('counter');
    expect(badgeContent).toContain('rounded-full');
  });

  test('9. Tabs uses rounded-lg for TabsList with sunken surface, and rounded-md for TabsTrigger', () => {
    const tabsContent = fs.readFileSync(path.join(UI_DIR, 'tabs.jsx'), 'utf8');
    expect(tabsContent).toContain('rounded-lg');
    expect(tabsContent).toContain('rounded-md');
    expect(tabsContent).toContain('var(--surface-sunken)');
  });
});
