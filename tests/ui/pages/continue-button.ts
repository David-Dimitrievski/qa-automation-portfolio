import type { Locator, Page } from '@playwright/test';

/**
 * The checkout steps' "Continue" button found by its visible text. Its accessible name names the
 * wrong step on the address and delivery pages (defect UI-A11Y-002), so page objects must not
 * depend on it. Only one checkout step is on screen at a time.
 */
export function continueButton(page: Page): Locator {
  return page.getByRole('button').filter({ hasText: 'Continue' });
}
