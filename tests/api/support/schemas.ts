import { expect } from '@playwright/test';

/** Reusable schema checks: required fields and their types. Values are asserted in the specs. */

export function expectUserSchema(user: unknown): void {
  expect(user).toMatchObject({
    id: expect.any(Number),
    role: expect.any(String),
    isActive: expect.any(Boolean),
  });
  expect(user).not.toHaveProperty('password');
}

export function expectProductSchema(product: unknown): void {
  expect(product).toMatchObject({
    id: expect.any(Number),
    name: expect.any(String),
    description: expect.any(String),
    image: expect.any(String),
    price: expect.any(Number),
    deluxePrice: expect.any(Number),
    alternateImages: expect.any(Array),
  });
}

export function expectBasketSchema(basket: unknown): void {
  expect(basket).toMatchObject({
    id: expect.any(Number),
    UserId: expect.any(Number),
    Products: expect.any(Array),
  });
}

export function expectBasketItemSchema(item: unknown): void {
  expect(item).toMatchObject({
    id: expect.any(Number),
    ProductId: expect.any(Number),
    BasketId: expect.any(String),
    quantity: expect.any(Number),
  });
}

/** PUT /api/BasketItems/{id} echoes the stored row, so BasketId comes back as a number. */
export function expectUpdatedBasketItemSchema(item: unknown): void {
  expect(item).toMatchObject({
    id: expect.any(Number),
    ProductId: expect.any(Number),
    BasketId: expect.any(Number),
    quantity: expect.any(Number),
  });
}

/** A JWT is three non-empty, dot-separated base64url segments. */
export function expectJwtShape(token: string): void {
  expect(token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
}
