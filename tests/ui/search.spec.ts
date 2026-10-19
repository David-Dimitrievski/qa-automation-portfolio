import { readJson } from '../api/support/clients';
import type { Envelope, Product } from '../api/support/types';
import { SEARCH } from './support/test-data';
import { expect, test } from './support/fixtures';

test.describe('Product search', () => {
  test('UI-PROD-001 should list the products that match the search term', async ({
    page,
    header,
    productList,
    productsApi,
  }) => {
    const response = await productsApi.search(SEARCH.withResults);
    expect(response.status()).toBe(200);
    const expected = (await readJson<Envelope<Product[]>>(response)).data.map((p) => p.name);
    expect(expected.length, 'the search term has matches').toBeGreaterThan(0);
    await header.goHome();

    await header.search(SEARCH.withResults);

    await expect(page).toHaveURL(new RegExp(`#/search\\?q=${SEARCH.withResults}$`));
    await expect(productList.searchResultsTitle(SEARCH.withResults)).toBeVisible();
    await expect(productList.productCards).toHaveCount(expected.length);
    for (const name of expected) {
      await expect.soft(productList.productCard(name)).toBeVisible();
    }
  });

  test('UI-PROD-003 should say so when nothing matches', async ({ page, header, productList }) => {
    await header.goHome();

    await header.search(SEARCH.withoutResults);

    await expect(page).toHaveURL(new RegExp(`#/search\\?q=${SEARCH.withoutResults}$`));
    await expect(productList.noResultsMessage).toBeVisible();
    await expect(productList.productCards).toHaveCount(0);
  });
});
