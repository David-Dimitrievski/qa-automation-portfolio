import type { Locator, Page } from '@playwright/test';

export class OrderCompletionPage {
  readonly heading: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Thank you for your purchase!' });
  }

  productRow(productName: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('cell', { name: productName, exact: true }),
    });
  }
}
