import type { Locator, Page } from '@playwright/test';

/** Checkout step 4: review the order before paying. */
export class OrderSummaryPage {
  readonly placeOrderButton: Locator;

  constructor(private readonly page: Page) {
    this.placeOrderButton = page.getByRole('button', { name: 'Complete your purchase' });
  }

  /** The amount next to a summary label: Items, Delivery, Promotion or Total Price. */
  amount(label: 'Items' | 'Delivery' | 'Promotion' | 'Total Price'): Locator {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: label, exact: true }) })
      .getByRole('cell')
      .filter({ hasText: '¤' });
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }
}
