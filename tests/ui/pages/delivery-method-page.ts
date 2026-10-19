import type { Locator, Page } from '@playwright/test';
import { continueButton } from './continue-button';

/** Checkout step 2: choose the delivery speed. */
export class DeliveryMethodPage {
  readonly continueButton: Locator;

  constructor(private readonly page: Page) {
    this.continueButton = continueButton(page);
  }

  speedRow(name: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('cell', { name, exact: true }),
    });
  }

  async selectSpeed(name: string): Promise<void> {
    await this.speedRow(name).getByRole('radio').check();
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }
}
