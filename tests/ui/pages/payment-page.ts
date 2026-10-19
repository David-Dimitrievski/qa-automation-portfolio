import type { Locator, Page } from '@playwright/test';
import type { CardFormInput } from '../support/test-data';

/** Checkout step 3: choose or add a payment card. */
export class PaymentPage {
  readonly heading: Locator;
  readonly addCardToggle: Locator;
  readonly cardNameInput: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryMonthSelect: Locator;
  readonly expiryYearSelect: Locator;
  readonly submitCardButton: Locator;
  readonly proceedToReviewButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'My Payment Options' });
    this.addCardToggle = page.getByRole('button', {
      name: 'Add new card Add a credit or debit card',
    });
    const cardForm = page.getByRole('region', { name: 'Add new card Add a credit or debit card' });
    this.cardNameInput = cardForm.getByRole('textbox', { name: 'Name' });
    this.cardNumberInput = cardForm.getByRole('spinbutton', { name: 'Card Number' });
    this.expiryMonthSelect = cardForm.getByRole('combobox', { name: 'Expiry Month' });
    this.expiryYearSelect = cardForm.getByRole('combobox', { name: 'Expiry Year' });
    this.submitCardButton = cardForm.getByRole('button', { name: 'Submit' });
    this.proceedToReviewButton = page.getByRole('button', { name: 'Proceed to review' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/payment/shop');
  }

  /** A saved card's row, found by its masked number, for example `************1111`. */
  cardRow(maskedNumber: string): Locator {
    return this.page.getByRole('row').filter({
      has: this.page.getByRole('cell', { name: maskedNumber, exact: true }),
    });
  }

  async selectCard(maskedNumber: string): Promise<void> {
    await this.cardRow(maskedNumber).getByRole('radio').check();
  }

  async fillCardForm(card: CardFormInput): Promise<void> {
    await this.addCardToggle.click();
    await this.cardNameInput.fill(card.name);
    await this.cardNumberInput.fill(card.number);
    await this.expiryMonthSelect.selectOption(card.expiryMonth);
    await this.expiryYearSelect.selectOption(card.expiryYear);
  }

  async submitCard(): Promise<void> {
    await this.submitCardButton.click();
  }

  async proceedToReview(): Promise<void> {
    await this.proceedToReviewButton.click();
  }
}
