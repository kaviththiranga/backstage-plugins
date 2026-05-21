/*
 * Playwright + @axe-core/playwright accessibility scan.
 *
 * Tag `@a11y` lets the suite be selected with `yarn test:e2e:a11y`. Each
 * route in `routes.ts` becomes one test; the axe result lands in
 * `audit-artifacts/axe/<route-id>.json` for downstream synthesis into
 * ACCESSIBILITY_AUDIT.md.
 *
 * Auth: this suite assumes the dev server is started with
 * OPENCHOREO_FEATURES_AUTH_ENABLED=false so DynamicSignInPage auto-signs
 * the guest user (see app-config.yaml). The sign-in page itself is
 * audited manually in Phase C via Chrome DevTools MCP.
 *
 * Tests do not fail on axe violations — the goal of this baseline run is
 * to *measure* the current state, not to gate CI. Promote to a failing
 * assertion as findings are remediated (see ACCESSIBILITY_AUDIT.md
 * Phase 3 of the remediation roadmap).
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';
import { ROUTES } from './routes';

// __dirname = packages/app/e2e-tests/e2e-test/a11y → up 5 levels = repo root.
const ARTIFACT_DIR = path.resolve(
  __dirname,
  '../../../../../audit-artifacts/axe',
);

// WCAG tag set targeted by the audit. axe-core groups rules by these
// tags; "best-practice" is included because BITV/BGG inspectors
// frequently cite axe best-practice rules even when not strictly WCAG.
const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
  'best-practice',
];

test.beforeAll(() => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
});

for (const route of ROUTES) {
  test(`@a11y ${route.area}: ${route.id} (${route.path})`, async ({
    page,
  }) => {
    test.setTimeout(45_000);

    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    // Handle the guest sign-in landing if it appears. `auth.enabled=false`
    // routes the app through <SignInPage auto providers={['guest']} />
    // which renders a single Guest provider tile with an "Enter" CTA on
    // first visit. We click it once per browser context — subsequent
    // navigations within the same test reuse the auth cookie.
    const enterBtn = page.getByRole('button', { name: /^enter$/i });
    if (await enterBtn.first().isVisible().catch(() => false)) {
      await enterBtn.first().click();
      // After the click the app navigates to the originally requested
      // route; wait for the SPA to mount the real page content (the
      // sidebar appears once the AppRouter renders).
      await page
        .waitForSelector('nav, [role="navigation"]', { timeout: 15_000 })
        .catch(() => {});
      // Some routes don't share state with the post-sign-in landing —
      // re-navigate explicitly to the requested path.
      if (!page.url().endsWith(route.path)) {
        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      }
    }

    // Wait until at least one of the main landmarks (or the sidebar) is
    // present, so we are scanning the real route, not the empty shell.
    await page
      .waitForSelector('header, main, [role="main"], nav, [role="navigation"]', {
        timeout: 15_000,
      })
      .catch(() => {});

    await page
      .waitForLoadState('networkidle', { timeout: 10_000 })
      .catch(() => {});
    await page.waitForTimeout(750);

    // Debug aid: capture what is actually on the page when we scan.
    const visibleText = (await page
      .locator('body')
      .innerText({ timeout: 5_000 })
      .catch(() => ''))
      .slice(0, 300);
    const screenshotPath = path.join(
      ARTIFACT_DIR,
      `${route.id}.screenshot.png`,
    );
    await page
      .screenshot({ path: screenshotPath, fullPage: false })
      .catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(WCAG_TAGS)
      .analyze();

    const summary = {
      route,
      timestamp: new Date().toISOString(),
      url: page.url(),
      title: await page.title(),
      visibleTextSample: visibleText,
      screenshot: path.basename(screenshotPath),
      consoleErrors,
      counts: {
        violations: results.violations.length,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        inapplicable: results.inapplicable.length,
      },
      violationsByImpact: results.violations.reduce<Record<string, number>>(
        (acc, v) => {
          const impact = v.impact ?? 'unknown';
          acc[impact] = (acc[impact] || 0) + 1;
          return acc;
        },
        {},
      ),
      violations: results.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        tags: v.tags,
        nodes: v.nodes.map(n => ({
          target: n.target,
          html: n.html.slice(0, 500),
          failureSummary: n.failureSummary,
        })),
      })),
      incomplete: results.incomplete.map(v => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length,
      })),
    };

    const outPath = path.join(ARTIFACT_DIR, `${route.id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

    // Always pass — this is a measurement run, not a gate. The recorded
    // JSON is the deliverable.
    expect(results).toBeTruthy();
  });
}
