import type { Locator, Page } from '@playwright/test';

/** The product grid: the home page ("All Products") and search results. */
export class ProductListPage {
  readonly productCards: Locator;
  readonly noResultsMessage: Locator;

  constructor(private readonly page: Page) {
    this.productCards = page.getByRole('main').getByRole('article');
    this.noResultsMessage = page.getByRole('main').getByText('No results found', { exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /** The heading above search results, for example "Search Results - apple". */
  searchResultsTitle(term: string): Locator {
    return this.page.getByRole('main').getByText(`Search Results - ${term}`, { exact: true });
  }

  productCard(name: string): Locator {
    return this.productCards.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  async addToBasket(name: string): Promise<void> {
    await this.productCard(name).getByRole('button', { name: 'Add to Basket' }).click();
  }
}
