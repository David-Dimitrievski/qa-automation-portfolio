import { storedToken, tokenCookie } from './support/browser-session';
import { expect, loggedInTest as test } from './support/fixtures';
import { PRODUCTS } from './support/test-data';

test.describe('Logout', () => {
  test('UI-AUTH-003 should end the session on logout', async ({ page, context, header, user }) => {
    await header.goHome();
    await header.openAccountMenu();
    await expect(header.profileMenuItem).toContainText(user.email);
    await header.logoutMenuItem.click();

    await expect(page).toHaveURL(/#\/$/);
    await header.openAccountMenu();
    await expect(header.loginMenuItem).toBeVisible();
    await expect(header.logoutMenuItem).toBeHidden();
    await expect.poll(() => storedToken(page)).toBeNull();
    await expect.poll(() => tokenCookie(context)).toBeUndefined();
  });

  test("UI-AUTH-004 should not show the previous user's basket after logout", async ({
    page,
    header,
    basketPage,
    seed,
    user,
  }) => {
    await seed.basketItem(PRODUCTS.bananaJuice);
    await basketPage.goto();
    await expect(basketPage.row(PRODUCTS.bananaJuice)).toBeVisible();

    await header.logOut();
    await expect(page).toHaveURL(/#\/$/);
    await basketPage.goto();
    await page.reload();

    await expect(basketPage.heading).toBeVisible();
    await expect(basketPage.heading).not.toContainText(user.email);
    await expect(basketPage.productRows).toHaveCount(0);
    await expect(basketPage.row(PRODUCTS.bananaJuice)).toBeHidden();
  });
});
