import { readJson, type BasketApi } from './support/clients';
import { expect, test } from './support/fixtures';
import {
  expectBasketItemSchema,
  expectBasketSchema,
  expectUpdatedBasketItemSchema,
} from './support/schemas';
import { APPLE_JUICE, UNKNOWN_ID, basketItemFor } from './support/test-data';
import type { Basket, BasketItem, Envelope, SessionUser } from './support/types';

/** Arrange step: puts Apple Juice into the user's own basket and returns the created item. */
async function addAppleJuice(
  basketApi: BasketApi,
  user: SessionUser,
  quantity = 1,
): Promise<BasketItem> {
  const response = await basketApi.addItem(basketItemFor(user, { quantity }), user.token);
  expect(response.status(), 'add Apple Juice to the basket').toBe(200);
  return (await readJson<Envelope<BasketItem>>(response)).data;
}

/** Reads a basket as its owner. */
async function basketOf(basketApi: BasketApi, user: SessionUser): Promise<Basket> {
  const response = await basketApi.get(user.basketId, user.token);
  expect(response.status(), 'read own basket').toBe(200);
  return (await readJson<Envelope<Basket>>(response)).data;
}

function quantitiesIn(basket: Basket): { id: number; quantity: number }[] {
  return basket.Products.map((product) => ({
    id: product.id,
    quantity: product.BasketItem.quantity,
  }));
}

test.describe('GET /rest/basket/{id}', () => {
  test('API-BSKT-001 should start a new user with an empty basket', async ({ basketApi, user }) => {
    const response = await basketApi.get(user.basketId, user.token);

    expect(response.status()).toBe(200);
    const body = await readJson<Envelope<Basket>>(response);
    expect(body.status).toBe('success');
    expectBasketSchema(body.data);
    expect(body.data).toMatchObject({
      id: user.basketId,
      UserId: user.id,
      coupon: null,
      Products: [],
    });
  });

  // Security control (OWASP API2:2023 Broken Authentication): a basket read needs a token.
  test(
    'API-BSKT-002 should reject an unauthenticated request',
    { tag: '@security-control' },
    async ({ basketApi, user }) => {
      const response = await basketApi.get(user.basketId);

      expect(response.status()).toBe(401);
    },
  );

  // Security control (OWASP API1:2023 BOLA): a user cannot read another user's basket.
  test(
    "API-BSKT-003 should reject reading another user's basket",
    { tag: '@security-control' },
    async ({ basketApi, user, otherUser }) => {
      await addAppleJuice(basketApi, otherUser);

      const response = await basketApi.get(otherUser.basketId, user.token);

      expect([401, 403, 404], `status ${response.status()} should be 401, 403 or 404`).toContain(
        response.status(),
      );
    },
  );
});

test.describe('POST /api/BasketItems', () => {
  test('API-BSKT-004 should add a product to the own basket', async ({ basketApi, user }) => {
    const item = basketItemFor(user, { quantity: 2 });

    const response = await basketApi.addItem(item, user.token);

    expect(response.status()).toBe(200);
    const body = await readJson<Envelope<BasketItem>>(response);
    expect(body.status).toBe('success');
    expectBasketItemSchema(body.data);
    expect(body.data).toMatchObject({
      ProductId: APPLE_JUICE.id,
      BasketId: String(user.basketId),
      quantity: 2,
    });
  });

  test('API-BSKT-005 should show an added product in the basket', async ({ basketApi, user }) => {
    await addAppleJuice(basketApi, user, 2);

    const basket = await basketOf(basketApi, user);

    expect(quantitiesIn(basket)).toEqual([{ id: APPLE_JUICE.id, quantity: 2 }]);
  });

  // Security control (OWASP WSTG-ERRH-01): a duplicate product is a client error, not a 500.
  test(
    'API-BSKT-006 should reject adding the same product twice with a client error',
    { tag: '@security-control' },
    async ({ basketApi, user }) => {
      await addAppleJuice(basketApi, user, 2);

      const response = await basketApi.addItem(basketItemFor(user), user.token);

      expect([400, 409], `status ${response.status()} should be 400 or 409`).toContain(
        response.status(),
      );
      expect(quantitiesIn(await basketOf(basketApi, user))).toEqual([
        { id: APPLE_JUICE.id, quantity: 2 },
      ]);
    },
  );

  // Security control (OWASP API1:2023 BOLA): a user cannot add to another user's basket.
  test(
    "API-BSKT-007 should reject adding to another user's basket",
    { tag: '@security-control' },
    async ({ basketApi, user, otherUser }) => {
      const response = await basketApi.addItem(basketItemFor(otherUser), user.token);

      expect(response.status()).toBe(401);
      expect(await response.text()).toBe("{'error' : 'Invalid BasketId'}");
      expect((await basketOf(basketApi, otherUser)).Products).toEqual([]);
    },
  );

  // Security control (OWASP WSTG-ERRH-01): an unknown product id is a client error, not a 500.
  test(
    'API-BSKT-008 should reject an unknown product',
    { tag: '@security-control' },
    async ({ basketApi, user }) => {
      const response = await basketApi.addItem(
        basketItemFor(user, { ProductId: UNKNOWN_ID }),
        user.token,
      );

      expect([400, 404], `status ${response.status()} should be 400 or 404`).toContain(
        response.status(),
      );
    },
  );

  // Security control (OWASP WSTG-BUSL-01): the quantity must be positive.
  test(
    'API-BSKT-009 should reject a quantity of zero',
    { tag: '@security-control' },
    async ({ basketApi, user }) => {
      const response = await basketApi.addItem(basketItemFor(user, { quantity: 0 }), user.token);

      expect(response.status()).toBe(400);
      expect((await basketOf(basketApi, user)).Products).toEqual([]);
    },
  );

  // In the pinned image a non-numeric quantity trips Apple Juice's (product 1) per-user limit
  // check, so the request is rejected with the limit message rather than a type error.
  test('API-BSKT-010 should reject a non-numeric quantity', async ({ basketApi, user }) => {
    const response = await basketApi.addItem(basketItemFor(user, { quantity: 'lots' }), user.token);

    expect(response.status()).toBe(400);
    expect(await readJson<{ error: string }>(response)).toEqual({
      error: 'You can order only up to 5 items of this product.',
    });
  });

  // Security control (OWASP API2:2023 Broken Authentication): adding an item needs a token.
  test(
    'API-BSKT-011 should reject an unauthenticated request',
    { tag: '@security-control' },
    async ({ basketApi, user }) => {
      const response = await basketApi.addItem(basketItemFor(user));

      expect(response.status()).toBe(401);
    },
  );

  // Security control (OWASP WSTG-ERRH-01): a malformed body is a 400, not a 500.
  test(
    'API-BSKT-012 should reject malformed JSON with 400',
    { tag: '@security-control' },
    async ({ basketApi, user }) => {
      const response = await basketApi.addItemRaw('{bad', user.token);

      expect(response.status()).toBe(400);
    },
  );
});

test.describe('PUT /api/BasketItems/{id}', () => {
  test('API-BSKT-013 should set the quantity idempotently', async ({ basketApi, user }) => {
    const item = await addAppleJuice(basketApi, user);

    for (const attempt of ['first', 'second']) {
      await test.step(`${attempt} update`, async () => {
        const response = await basketApi.updateQuantity(item.id, 5, user.token);

        expect(response.status()).toBe(200);
        const { data } = await readJson<Envelope<BasketItem>>(response);
        expectUpdatedBasketItemSchema(data);
        expect(data).toMatchObject({ id: item.id, quantity: 5 });
      });
    }
    expect(quantitiesIn(await basketOf(basketApi, user))).toEqual([
      { id: APPLE_JUICE.id, quantity: 5 },
    ]);
  });

  // Security control (OWASP API1:2023 BOLA): a user cannot change another user's basket item.
  test(
    "API-BSKT-014 should reject changing another user's basket item",
    { tag: '@security-control' },
    async ({ basketApi, user, otherUser }) => {
      const othersItem = await addAppleJuice(basketApi, otherUser);

      const response = await basketApi.updateQuantity(othersItem.id, 5, user.token);

      expect([401, 403, 404], `status ${response.status()} should be 401, 403 or 404`).toContain(
        response.status(),
      );
      expect(quantitiesIn(await basketOf(basketApi, otherUser))).toEqual([
        { id: APPLE_JUICE.id, quantity: 1 },
      ]);
    },
  );

  // Security control (OWASP WSTG-BUSL-01): the quantity must be positive.
  test(
    'API-BSKT-015 should reject a negative quantity',
    { tag: '@security-control' },
    async ({ basketApi, user }) => {
      const item = await addAppleJuice(basketApi, user);

      const response = await basketApi.updateQuantity(item.id, -1, user.token);

      expect(response.status()).toBe(400);
      expect(quantitiesIn(await basketOf(basketApi, user))).toEqual([
        { id: APPLE_JUICE.id, quantity: 1 },
      ]);
    },
  );
});

test.describe('DELETE /api/BasketItems/{id}', () => {
  test('API-BSKT-016 should remove an item exactly once', async ({ basketApi, user }) => {
    const item = await addAppleJuice(basketApi, user);

    await test.step('first delete removes the item', async () => {
      const response = await basketApi.removeItem(item.id, user.token);

      expect(response.status()).toBe(200);
      expect(await readJson<Envelope<Record<string, never>>>(response)).toEqual({
        status: 'success',
        data: {},
      });
      expect((await basketOf(basketApi, user)).Products).toEqual([]);
    });

    await test.step('second delete finds nothing', async () => {
      const response = await basketApi.removeItem(item.id, user.token);

      expect(response.status()).toBe(404);
    });
  });
});
