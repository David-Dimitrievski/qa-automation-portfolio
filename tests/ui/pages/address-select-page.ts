import type { Locator, Page } from '@playwright/test';
import { continueButton } from './continue-button';

/** Checkout step 1: choose the delivery address. */
export class AddressSelectPage {
  readonly heading: Locator;
  readonly addNewAddressButton: Locator;
  readonly continueButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Select an address' });
    this.addNewAddressButton = page.getByRole('button', { name: 'Add a new address' });
    this.continueButton = continueButton(page);
  }

  addressRow(fullName: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('cell', { name: fullName, exact: true }),
    });
  }

  async selectAddress(fullName: string): Promise<void> {
    await this.addressRow(fullName).getByRole('radio').check();
  }

  async addNewAddress(): Promise<void> {
    await this.addNewAddressButton.click();
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }
}
