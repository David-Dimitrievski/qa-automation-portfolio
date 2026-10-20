import { test, type Page } from '@playwright/test';
import { AddressSelectPage } from './address-select-page';
import { BasketPage } from './basket-page';
import { DeliveryMethodPage } from './delivery-method-page';
import { OrderSummaryPage } from './order-summary-page';
import { PaymentPage } from './payment-page';

export interface CheckoutChoices {
  addressName: string;
  deliverySpeed: string;
  maskedCardNumber: string;
}

/** Walks the checkout steps from the basket, for cases that are about a later step. */
export class CheckoutFlow {
  private readonly basket: BasketPage;
  private readonly addressSelect: AddressSelectPage;
  private readonly deliveryMethod: DeliveryMethodPage;
  private readonly payment: PaymentPage;
  private readonly orderSummary: OrderSummaryPage;

  constructor(page: Page) {
    this.basket = new BasketPage(page);
    this.addressSelect = new AddressSelectPage(page);
    this.deliveryMethod = new DeliveryMethodPage(page);
    this.payment = new PaymentPage(page);
    this.orderSummary = new OrderSummaryPage(page);
  }

  /** Goes from the basket to the order review with the given choices. */
  async reachReview(choices: CheckoutChoices): Promise<void> {
    await test.step('check out the basket', async () => {
      await this.basket.goto();
      await this.basket.checkout();
    });

    await test.step('choose the address', async () => {
      await this.addressSelect.selectAddress(choices.addressName);
      await this.addressSelect.continue();
    });

    await test.step('choose the delivery speed', async () => {
      await this.deliveryMethod.selectSpeed(choices.deliverySpeed);
      await this.deliveryMethod.continue();
    });

    await test.step('choose the card', async () => {
      await this.payment.selectCard(choices.maskedCardNumber);
      await this.payment.proceedToReview();
    });
  }

  async placeOrder(choices: CheckoutChoices): Promise<void> {
    await this.reachReview(choices);

    await test.step('place the order', async () => {
      await this.orderSummary.placeOrder();
    });
  }
}
