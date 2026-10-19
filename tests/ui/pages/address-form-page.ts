import type { Locator, Page } from '@playwright/test';
import type { AddressRequest } from '../support/setup-api';

export class AddressFormPage {
  readonly countryInput: Locator;
  readonly nameInput: Locator;
  readonly mobileNumberInput: Locator;
  readonly zipCodeInput: Locator;
  readonly addressInput: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.countryInput = page.getByRole('textbox', { name: 'Country' });
    this.nameInput = page.getByRole('textbox', { name: 'Name' });
    this.mobileNumberInput = page.getByRole('spinbutton', { name: 'Mobile Number' });
    this.zipCodeInput = page.getByRole('textbox', { name: 'ZIP Code' });
    this.addressInput = page.getByRole('textbox', { name: 'Address' });
    this.cityInput = page.getByRole('textbox', { name: 'City' });
    this.stateInput = page.getByRole('textbox', { name: 'State' });
    this.submitButton = page.getByRole('button', { name: 'Submit' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/address/create');
  }

  /** A validation message by its exact text; the placeholders repeat it but are not text. */
  message(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }

  async fillForm(address: AddressRequest): Promise<void> {
    await this.countryInput.fill(address.country);
    await this.nameInput.fill(address.fullName);
    await this.mobileNumberInput.fill(String(address.mobileNum));
    await this.zipCodeInput.fill(address.zipCode);
    await this.addressInput.fill(address.streetAddress);
    await this.cityInput.fill(address.city);
    await this.stateInput.fill(address.state);
  }

  /** Focuses and leaves every field without typing, so each one is marked touched. */
  async touchEveryField(): Promise<void> {
    for (const field of [
      this.countryInput,
      this.nameInput,
      this.mobileNumberInput,
      this.zipCodeInput,
      this.addressInput,
      this.cityInput,
      this.stateInput,
    ]) {
      await field.focus();
      await field.blur();
    }
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
