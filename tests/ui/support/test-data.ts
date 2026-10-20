import { randomInt, randomUUID } from 'node:crypto';
import type { AddressRequest, CardRequest } from './setup-api';

/** Seed products of the pinned Juice Shop image; prices are always read from the API. */
export const PRODUCTS = {
  appleJuice: 'Apple Juice (1000ml)',
  bananaJuice: 'Banana Juice (1000ml)',
  // Checkout cases order Green Smoothie (large stock) so repeated runs never sell it out.
  greenSmoothie: 'Green Smoothie',
} as const;

export const SEARCH = {
  withResults: 'apple',
  withoutResults: 'zzzzqqq',
} as const;

/** Delivery speeds offered at checkout and their price for a non-deluxe customer. */
export const DELIVERY_SPEEDS = [
  { name: 'One Day Delivery', price: 0.99 },
  { name: 'Fast Delivery', price: 0.5 },
  { name: 'Standard Delivery', price: 0 },
] as const;

export const STANDARD_DELIVERY = 'Standard Delivery';

/** Card expiry years offered by the payment form (2080-2099). */
const CARD_EXPIRY_YEARS = { min: 2080, max: 2099 } as const;

/** Basket total as the basket page renders it: no trailing zeros, for example `0¤` or `5.97¤`. */
export function basketTotal(amount: number): string {
  return `Total Price: ${Number(amount.toFixed(2))}¤`;
}

/** Amount as the order review renders it, always with two decimals, for example `0.50¤`. */
export function reviewAmount(amount: number): string {
  return `${amount.toFixed(2)}¤`;
}

/** A 16-digit number whose last four digits are unique enough to find the card in a list. */
export function newCardNumber(): string {
  // randomInt is limited to 48-bit ranges, so the 15 random digits come in two parts.
  const high = String(randomInt(0, 10 ** 7)).padStart(7, '0');
  const low = String(randomInt(0, 10 ** 8)).padStart(8, '0');
  return `4${high}${low}`;
}

function lastFour(cardNumber: string | number): string {
  return String(cardNumber).slice(-4);
}

/** Card number masked the way the saved-card list shows it. */
export function maskedCardNumber(cardNumber: string | number): string {
  return `************${lastFour(cardNumber)}`;
}

export function newAddress(overrides: Partial<AddressRequest> = {}): AddressRequest {
  const tag = randomUUID().slice(0, 8);
  return {
    country: 'Testland',
    fullName: `UI Tester ${tag}`,
    mobileNum: randomInt(1_000_000, 10_000_000),
    zipCode: String(randomInt(10_000, 100_000)),
    streetAddress: `${randomInt(1, 999)} Test Street`,
    city: `City ${tag}`,
    state: 'TS',
    ...overrides,
  };
}

export function newCard(overrides: Partial<CardRequest> = {}): CardRequest {
  return {
    fullName: `UI Card Holder ${randomUUID().slice(0, 8)}`,
    cardNum: Number(newCardNumber()),
    expMonth: randomInt(1, 13),
    expYear: randomInt(CARD_EXPIRY_YEARS.min, CARD_EXPIRY_YEARS.max + 1),
    ...overrides,
  };
}

/** Values typed into the add-card form at checkout. */
export interface CardFormInput {
  name: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
}

export function newCardFormInput(overrides: Partial<CardFormInput> = {}): CardFormInput {
  const card = newCard();
  return {
    name: card.fullName,
    number: String(card.cardNum),
    expiryMonth: String(card.expMonth),
    expiryYear: String(card.expYear),
    ...overrides,
  };
}
