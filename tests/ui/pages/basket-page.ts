import type { Locator, Page } from '@playwright/test';

export class BasketPage {
  readonly heading: Locator;
  /** Product lines only; the table's header row has no cells. */
  readonly productRows: Locator;
  readonly totalPrice: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /^Your Basket/ });
    this.productRows = page.getByRole('row').filter({ has: page.getByRole('cell') });
    this.totalPrice = page.getByText(/^Total Price: /);
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/basket');
  }

  row(productName: string): Locator {
    return this.productRows.filter({
      has: this.page.getByRole('cell', { name: productName, exact: true }),
    });
  }

  // The quantity and remove buttons have no accessible name (defect UI-A11Y-001), so they can
  // only be told apart by position inside their own row. Keep these positional locators here.

  /** The cell holding the minus button, the quantity and the plus button. */
  quantity(productName: string): Locator {
    return this.row(productName)
      .getByRole('cell')
      .filter({ has: this.page.getByRole('button') })
      .first();
  }

  decreaseButton(productName: string): Locator {
    return this.quantity(productName).getByRole('button').first();
  }

  increaseButton(productName: string): Locator {
    return this.quantity(productName).getByRole('button').last();
  }

  removeButton(productName: string): Locator {
    return this.row(productName).getByRole('cell').last().getByRole('button');
  }

  async increase(productName: string): Promise<void> {
    await this.clickAndAwaitUpdate(this.increaseButton(productName), 'PUT');
  }

  /** At quantity 1 the app still sends an update, so the wait is the same either way. */
  async decrease(productName: string): Promise<void> {
    await this.clickAndAwaitUpdate(this.decreaseButton(productName), 'PUT');
  }

  async remove(productName: string): Promise<void> {
    await this.clickAndAwaitUpdate(this.removeButton(productName), 'DELETE');
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }

  private async clickAndAwaitUpdate(button: Locator, method: 'PUT' | 'DELETE'): Promise<void> {
    const update = this.page.waitForResponse(
      (response) =>
        response.request().method() === method && /\/api\/BasketItems\/\d+$/.test(response.url()),
    );
    await button.click();
    await update;
  }
}
