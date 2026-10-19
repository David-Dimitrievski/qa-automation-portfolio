import { readJson } from './support/clients';
import { expect, test } from './support/fixtures';
import { expectProductSchema } from './support/schemas';
import {
  APPLE_JUICE,
  MIN_SEED_PRODUCT_COUNT,
  SEARCH_TERM_WITH_RESULTS,
  SEARCH_TERM_WITHOUT_RESULTS,
  UNKNOWN_ID,
} from './support/test-data';
import type { Envelope, Product, ValidationError } from './support/types';

const NOT_FOUND: ValidationError = { message: 'Not Found', errors: [] };

test.describe('GET /api/Products', () => {
  test('API-PROD-001 should list the catalogue with a valid schema', async ({ productsApi }) => {
    const response = await productsApi.list();

    expect(response.status()).toBe(200);
    const body = await readJson<Envelope<Product[]>>(response);
    expect(body.status).toBe('success');
    expect(body.data.length).toBeGreaterThanOrEqual(MIN_SEED_PRODUCT_COUNT);
    body.data.forEach(expectProductSchema);
    expect(body.data.map((product) => product.id)).toContain(APPLE_JUICE.id);
  });

  test('API-PROD-002 should return a seed product by id', async ({ productsApi }) => {
    const response = await productsApi.get(APPLE_JUICE.id);

    expect(response.status()).toBe(200);
    const { data } = await readJson<Envelope<Product>>(response);
    expectProductSchema(data);
    expect(data).toMatchObject(APPLE_JUICE);
  });

  test('API-PROD-003 should return 404 for an unknown id', async ({ productsApi }) => {
    const response = await productsApi.get(UNKNOWN_ID);

    expect(response.status()).toBe(404);
    expect(await readJson<ValidationError>(response)).toEqual(NOT_FOUND);
  });

  test('API-PROD-004 should return 404 for a non-numeric id', async ({ productsApi }) => {
    const response = await productsApi.get('abc');

    expect(response.status()).toBe(404);
    expect(await readJson<ValidationError>(response)).toEqual(NOT_FOUND);
  });
});

test.describe('GET /rest/products/search', () => {
  test('API-PROD-005 should return matching products', async ({ productsApi }) => {
    const response = await productsApi.search(SEARCH_TERM_WITH_RESULTS);

    expect(response.status()).toBe(200);
    const body = await readJson<Envelope<Product[]>>(response);
    expect(body.status).toBe('success');
    expect(body.data).not.toHaveLength(0);
    body.data.forEach(expectProductSchema);
    expect(body.data.map((product) => product.id)).toContain(APPLE_JUICE.id);
  });

  test('API-PROD-006 should return an empty list when nothing matches', async ({ productsApi }) => {
    const response = await productsApi.search(SEARCH_TERM_WITHOUT_RESULTS);

    expect(response.status()).toBe(200);
    const body = await readJson<Envelope<Product[]>>(response);
    expect(body.status).toBe('success');
    expect(body.data).toEqual([]);
  });
});
