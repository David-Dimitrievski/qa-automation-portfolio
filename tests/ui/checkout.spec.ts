import {
  DELIVERY_SPEEDS,
  PRODUCTS,
  STANDARD_DELIVERY,
  basketTotal,
  maskedCardNumber,
  newAddress,
  newCardFormInput,
  newCardNumber,
  reviewAmount,
} from './support/test-data';
import { expect, loggedInTest as test } from './support/fixtures';

test.describe('Checkout journey', () => {
  test('UI-CHK-001 should place an order with a saved address and card', async ({
    seed,
    checkout,
    orderCompletionPage,
  }) => {
    await seed.basketItem(PRODUCTS.greenSmoothie, 1);
    const address = await seed.address();
    const card = await seed.card();

    await checkout.placeOrder({
      addressName: address.fullName,
      deliverySpeed: STANDARD_DELIVERY,
      maskedCardNumber: maskedCardNumber(card.cardNum),
    });

    await expect(orderCompletionPage.heading).toBeVisible();
    await expect(orderCompletionPage.productRow(PRODUCTS.greenSmoothie)).toBeVisible();
  });

  for (const speed of DELIVERY_SPEEDS) {
    test(`UI-CHK-002 should add the ${speed.name} price to the order total`, async ({
      seed,
      catalog,
      checkout,
      orderSummaryPage,
    }) => {
      const product = await catalog.product(PRODUCTS.greenSmoothie);
      await seed.basketItem(product.name, 1);
      const address = await seed.address();
      const card = await seed.card();

      await checkout.reachReview({
        addressName: address.fullName,
        deliverySpeed: speed.name,
        maskedCardNumber: maskedCardNumber(card.cardNum),
      });

      await expect(orderSummaryPage.amount('Items')).toHaveText(reviewAmount(product.price));
      await expect(orderSummaryPage.amount('Delivery')).toHaveText(reviewAmount(speed.price));
      await expect(orderSummaryPage.amount('Total Price')).toHaveText(
        reviewAmount(product.price + speed.price),
      );
    });
  }

  test('UI-CHK-003 should empty the basket after the order is placed', async ({
    seed,
    checkout,
    orderCompletionPage,
    header,
    basketPage,
  }) => {
    await seed.basketItem(PRODUCTS.greenSmoothie, 1);
    const address = await seed.address();
    const card = await seed.card();
    await checkout.placeOrder({
      addressName: address.fullName,
      deliverySpeed: STANDARD_DELIVERY,
      maskedCardNumber: maskedCardNumber(card.cardNum),
    });
    await expect(orderCompletionPage.heading).toBeVisible();

    await basketPage.goto();

    await expect(basketPage.totalPrice).toHaveText(basketTotal(0));
    await expect(basketPage.productRows).toHaveCount(0);
    await expect(header.basketCount).toHaveText('0');
  });

  test('UI-CHK-005 should keep Continue disabled until each step has a selection', async ({
    seed,
    basketPage,
    addressSelectPage,
    deliveryMethodPage,
    paymentPage,
  }) => {
    await seed.basketItem(PRODUCTS.greenSmoothie, 1);
    const address = await seed.address();
    const card = await seed.card();
    await basketPage.goto();
    await basketPage.checkout();

    await test.step('address', async () => {
      await expect(addressSelectPage.addressRow(address.fullName)).toBeVisible();
      await expect(addressSelectPage.continueButton).toBeDisabled();
      await addressSelectPage.selectAddress(address.fullName);
      await expect(addressSelectPage.continueButton).toBeEnabled();
      await addressSelectPage.continue();
    });

    await test.step('delivery speed', async () => {
      await expect(deliveryMethodPage.speedRow(STANDARD_DELIVERY)).toBeVisible();
      await expect(deliveryMethodPage.continueButton).toBeDisabled();
      await deliveryMethodPage.selectSpeed(STANDARD_DELIVERY);
      await expect(deliveryMethodPage.continueButton).toBeEnabled();
      await deliveryMethodPage.continue();
    });

    await test.step('payment', async () => {
      await expect(paymentPage.cardRow(maskedCardNumber(card.cardNum))).toBeVisible();
      await expect(paymentPage.proceedToReviewButton).toBeDisabled();
      await paymentPage.selectCard(maskedCardNumber(card.cardNum));
      await expect(paymentPage.proceedToReviewButton).toBeEnabled();
    });
  });
});

test.describe('Checkout address', () => {
  test('UI-CHK-004 should add a new address during checkout and allow selecting it', async ({
    seed,
    basketPage,
    addressSelectPage,
    addressFormPage,
  }) => {
    await seed.basketItem(PRODUCTS.greenSmoothie, 1);
    const address = newAddress();
    await basketPage.goto();
    await basketPage.checkout();
    await addressSelectPage.addNewAddress();

    await addressFormPage.fillForm(address);
    await addressFormPage.submit();

    await expect(addressSelectPage.heading).toBeVisible();
    await expect(addressSelectPage.addressRow(address.fullName)).toBeVisible();
    await addressSelectPage.selectAddress(address.fullName);
    await expect(addressSelectPage.continueButton).toBeEnabled();
  });

  // State is optional in the app (no required validator), so it shows no message.
  test('UI-CHK-006 should require every mandatory address field once touched', async ({
    addressFormPage,
  }) => {
    await addressFormPage.goto();

    await addressFormPage.touchEveryField();

    for (const message of [
      'Please provide a country.',
      'Please provide a name.',
      'Please provide a mobile number.',
      'Please provide a ZIP code.',
      'Please provide an address.',
      'Please provide a city.',
    ]) {
      await expect.soft(addressFormPage.message(message)).toBeVisible();
    }
    await expect(addressFormPage.submitButton).toBeDisabled();
  });
});

test.describe('Checkout payment card', () => {
  test.beforeEach(async ({ paymentPage }) => {
    await paymentPage.goto();
    await expect(paymentPage.heading).toBeVisible();
  });

  test('UI-CHK-007 should add a card during checkout and allow selecting it', async ({
    paymentPage,
  }) => {
    const card = newCardFormInput();

    await paymentPage.fillCardForm(card);
    await paymentPage.submitCard();

    const savedCard = paymentPage.cardRow(maskedCardNumber(card.number));
    await expect(savedCard).toBeVisible();
    await expect(savedCard).toContainText(card.name);
    await expect(paymentPage.proceedToReviewButton).toBeDisabled();
    await paymentPage.selectCard(maskedCardNumber(card.number));
    await expect(paymentPage.proceedToReviewButton).toBeEnabled();
  });

  const cardNumberLengths = [
    { digits: 15, valid: false },
    { digits: 16, valid: true },
    { digits: 17, valid: false },
  ];
  for (const { digits, valid } of cardNumberLengths) {
    test(`UI-CHK-008 should ${valid ? 'accept' : 'reject'} a ${digits}-digit card number`, async ({
      paymentPage,
    }) => {
      const sixteenDigits = newCardNumber();
      const number = sixteenDigits.padEnd(digits, '1').slice(0, digits);

      await paymentPage.fillCardForm(newCardFormInput({ number }));

      await expect(paymentPage.submitCardButton).toBeEnabled({ enabled: valid });
    });
  }
});
