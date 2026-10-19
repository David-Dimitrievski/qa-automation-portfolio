import { PRODUCTS, STANDARD_DELIVERY } from './support/test-data';
import { expect, loggedInTest as test } from './support/fixtures';

test.describe('Accessible names', () => {
  // Known defect: the quantity and remove buttons are icon-only with no accessible name.
  test('UI-A11Y-001 should name the basket quantity and remove buttons', async ({
    seed,
    basketPage,
  }) => {
    await seed.basketItem(PRODUCTS.bananaJuice, 2);

    await basketPage.goto();

    await expect(basketPage.row(PRODUCTS.bananaJuice)).toBeVisible();
    await expect.soft(basketPage.decreaseButton(PRODUCTS.bananaJuice)).toHaveAccessibleName(/\S/);
    await expect.soft(basketPage.increaseButton(PRODUCTS.bananaJuice)).toHaveAccessibleName(/\S/);
    await expect.soft(basketPage.removeButton(PRODUCTS.bananaJuice)).toHaveAccessibleName(/\S/);
  });

  // Known defect: the address and delivery steps' Continue buttons carry each other's names.
  test('UI-A11Y-002 should name each Continue button after the step it opens', async ({
    seed,
    basketPage,
    addressSelectPage,
    deliveryMethodPage,
  }) => {
    await seed.basketItem(PRODUCTS.greenSmoothie, 1);
    const address = await seed.address();
    await basketPage.goto();
    await basketPage.checkout();

    await test.step('address step opens delivery selection', async () => {
      await addressSelectPage.selectAddress(address.fullName);
      await expect.soft(addressSelectPage.continueButton).toHaveAccessibleName(/delivery/i);
      await addressSelectPage.continue();
    });

    await test.step('delivery step opens payment selection', async () => {
      await deliveryMethodPage.selectSpeed(STANDARD_DELIVERY);
      await expect.soft(deliveryMethodPage.continueButton).toHaveAccessibleName(/payment/i);
    });
  });
});
