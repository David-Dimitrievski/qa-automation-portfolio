import { randomUUID } from 'node:crypto';
import { test } from '@playwright/test';
import type { SessionUser } from './types';

/** Seed product shipped with the pinned Juice Shop image. Read-only: never mutate it. */
export const APPLE_JUICE = {
  id: 1,
  name: 'Apple Juice (1000ml)',
  description: 'The all-time classic.',
  price: 1.99,
  deluxePrice: 0.99,
} as const;

export const MIN_SEED_PRODUCT_COUNT = 46;
export const UNKNOWN_ID = 99999;
export const SEARCH_TERM_WITH_RESULTS = 'apple';
export const SEARCH_TERM_WITHOUT_RESULTS = 'zzzzqqq';

export interface RegistrationRequest {
  email?: string;
  password: string;
  passwordRepeat: string;
  securityQuestion: { id: number };
  securityAnswer: string;
  role?: string;
}

export interface BasketItemRequest {
  ProductId: number;
  BasketId: string;
  // A string is allowed so wrong-type input can be sent.
  quantity: number | string;
}

/** Unique per test run and per worker, so parallel tests never collide on the unique email. */
export function uniqueEmail(prefix = 'api'): string {
  return `${prefix}-w${test.info().workerIndex}-${randomUUID()}@example.test`;
}

export function newRegistration(overrides: Partial<RegistrationRequest> = {}): RegistrationRequest {
  const password = randomUUID();
  return {
    email: uniqueEmail(),
    password,
    passwordRepeat: password,
    securityQuestion: { id: 1 },
    securityAnswer: randomUUID(),
    ...overrides,
  };
}

export function basketItemFor(
  user: SessionUser,
  overrides: Partial<BasketItemRequest> = {},
): BasketItemRequest {
  return { ProductId: APPLE_JUICE.id, BasketId: String(user.basketId), quantity: 1, ...overrides };
}
