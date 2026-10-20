import type { Locator, Page } from '@playwright/test';

/** Short confirmation messages (snack bars) shown at the bottom of any screen. */
export class Notifications {
  constructor(private readonly page: Page) {}

  /** A message by its exact text, for example "Placed Apple Juice (1000ml) into basket.". */
  message(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }
}
