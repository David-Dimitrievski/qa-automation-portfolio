import { PRODUCTS, basketTotal } from './support/test-data';
import { expect, loggedInTest as test } from './support/fixtures';

test.describe('Add to basket from the product grid', () => {
  test.beforeEach(async ({ productList, header }) => {
    await productList.goto();
    await expect(header.basketCount).toHaveText('0');
  });

  test('UI-BSKT-001 should add a product and confirm it', async ({
    productList,
    notifications,
    header,
  }) => {
    await productList.addToBasket(PRODUCTS.bananaJuice);

    await expect(
      notifications.message(`Placed ${PRODUCTS.bananaJuice} into basket.`),
    ).toBeVisible();
    await expect(header.basketCount).toHaveText('1');
  });

  test('UI-BSKT-002 should raise the quantity when the same product is added twice', async ({
    productList,
    header,
    basketPage,
  }) => {
    await productList.addToBasket(PRODUCTS.bananaJuice);
    await expect(header.basketCount).toHaveText('1');

    await productList.addToBasket(PRODUCTS.bananaJuice);

    await expect(header.basketCount).toHaveText('2');
    await basketPage.goto();
    await expect(basketPage.productRows).toHaveCount(1);
    await expect(basketPage.quantity(PRODUCTS.bananaJuice)).toHaveText('2');
  });
});

test.describe('Basket page', () => {
  test('UI-BSKT-003 should list the seeded products with quantities and total', async ({
    user,
    seed,
    catalog,
    basketPage,
  }) => {
    const apple = await catalog.product(PRODUCTS.appleJuice);
    const banana = await catalog.product(PRODUCTS.bananaJuice);
    await seed.basketItem(apple.name, 2);
    await seed.basketItem(banana.name, 1);

    await basketPage.goto();

    await expect(basketPage.heading).toContainText(user.email);
    await expect(basketPage.productRows).toHaveCount(2);
    await expect(basketPage.quantity(apple.name)).toHaveText('2');
    await expect(basketPage.quantity(banana.name)).toHaveText('1');
    await expect(basketPage.totalPrice).toHaveText(basketTotal(2 * apple.price + banana.price));
  });

  test('UI-BSKT-004 should raise the quantity with the plus button', async ({
    seed,
    catalog,
    basketPage,
    header,
  }) => {
    const banana = await catalog.product(PRODUCTS.bananaJuice);
    await seed.basketItem(banana.name, 1);
    await basketPage.goto();
    await expect(basketPage.quantity(banana.name)).toHaveText('1');

    await basketPage.increase(banana.name);

    await expect(basketPage.quantity(banana.name)).toHaveText('2');
    await expect(basketPage.totalPrice).toHaveText(basketTotal(2 * banana.price));
    await expect(header.basketCount).toHaveText('2');
  });

  test('UI-BSKT-005 should remove one product line and keep the other', async ({
    seed,
    catalog,
    basketPage,
    header,
  }) => {
    const banana = await catalog.product(PRODUCTS.bananaJuice);
    await seed.basketItem(PRODUCTS.appleJuice, 1);
    await seed.basketItem(banana.name, 1);
    await basketPage.goto();
    await expect(basketPage.productRows).toHaveCount(2);

    await basketPage.remove(PRODUCTS.appleJuice);

    await expect(basketPage.row(PRODUCTS.appleJuice)).toBeHidden();
    await expect(basketPage.productRows).toHaveCount(1);
    await expect(basketPage.row(banana.name)).toBeVisible();
    await expect(basketPage.totalPrice).toHaveText(basketTotal(banana.price));
    await expect(header.basketCount).toHaveText('1');
  });

  test('UI-BSKT-006 should lower the quantity with the minus button but not below 1', async ({
    seed,
    catalog,
    basketPage,
  }) => {
    const banana = await catalog.product(PRODUCTS.bananaJuice);
    await seed.basketItem(banana.name, 2);
    await basketPage.goto();
    await expect(basketPage.quantity(banana.name)).toHaveText('2');

    await test.step('2 -> 1', async () => {
      await basketPage.decrease(banana.name);

      await expect(basketPage.quantity(banana.name)).toHaveText('1');
      await expect(basketPage.totalPrice).toHaveText(basketTotal(banana.price));
    });

    await test.step('1 stays 1', async () => {
      await basketPage.decrease(banana.name);

      await expect(basketPage.productRows).toHaveCount(1);
      await expect(basketPage.quantity(banana.name)).toHaveText('1');
      await expect(basketPage.totalPrice).toHaveText(basketTotal(banana.price));
    });
  });

  test('UI-BSKT-007 should empty the basket when its only line is removed', async ({
    seed,
    basketPage,
    header,
  }) => {
    await seed.basketItem(PRODUCTS.bananaJuice, 1);
    await basketPage.goto();
    await expect(basketPage.row(PRODUCTS.bananaJuice)).toBeVisible();

    await basketPage.remove(PRODUCTS.bananaJuice);

    await expect(basketPage.productRows).toHaveCount(0);
    await expect(basketPage.totalPrice).toHaveText(basketTotal(0));
    await expect(header.basketCount).toHaveText('0');
  });
});
