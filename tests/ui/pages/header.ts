import type { Locator, Page } from '@playwright/test';

/** Top navigation bar shown on every screen: search, account menu and basket button. */
export class Header {
  readonly accountMenuButton: Locator;
  readonly profileMenuItem: Locator;
  readonly logoutMenuItem: Locator;
  readonly loginMenuItem: Locator;
  readonly basketButton: Locator;
  /** The number on the basket button. */
  readonly basketCount: Locator;
  private readonly openSearchButton: Locator;
  private readonly searchBox: Locator;

  constructor(private readonly page: Page) {
    this.accountMenuButton = page.getByRole('button', { name: 'Show/hide account menu' });
    this.profileMenuItem = page.getByRole('menuitem', { name: 'Go to user profile' });
    this.logoutMenuItem = page.getByRole('menuitem', { name: 'Logout' });
    this.loginMenuItem = page.getByRole('menuitem', { name: 'Go to login page' });
    this.basketButton = page.getByRole('button', { name: 'Show the shopping cart' });
    this.basketCount = this.basketButton.getByText(/^\d+$/);
    this.openSearchButton = page.getByRole('button', { name: 'Open search' });
    // The search input has no accessible name, label or placeholder, so it is scoped through
    // the app's stable #searchQuery search-bar element instead.
    this.searchBox = page.locator('#searchQuery').getByRole('textbox');
  }

  async openAccountMenu(): Promise<void> {
    await this.accountMenuButton.click();
  }

  async logOut(): Promise<void> {
    await this.openAccountMenu();
    await this.logoutMenuItem.click();
  }

  async search(term: string): Promise<void> {
    await this.openSearchButton.click();
    await this.searchBox.fill(term);
    await this.searchBox.press('Enter');
  }

  async goHome(): Promise<void> {
    await this.page.goto('/');
  }
}
