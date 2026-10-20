import { storedToken } from './support/browser-session';
import { expect, test } from './support/fixtures';

test.describe('Login', () => {
  test('UI-AUTH-001 should log in through the form', async ({
    page,
    loginPage,
    header,
    registeredUser,
  }) => {
    await loginPage.goto();

    await loginPage.logIn(registeredUser.email, registeredUser.password);

    await expect(page).not.toHaveURL(/#\/login/);
    await header.openAccountMenu();
    await expect(header.profileMenuItem).toContainText(registeredUser.email);
    await expect(header.logoutMenuItem).toBeVisible();
  });

  test('UI-AUTH-002 should reject a wrong password', async ({
    page,
    loginPage,
    registeredUser,
  }) => {
    await loginPage.goto();

    await loginPage.logIn(registeredUser.email, `${registeredUser.password}-wrong`);

    await expect(loginPage.errorMessage).toHaveText('Invalid email or password.');
    await expect(page).toHaveURL(/#\/login$/);
    await expect.poll(() => storedToken(page)).toBeNull();
  });

  const combinations = [
    { fields: 'neither email nor password', email: false, password: false, enabled: false },
    { fields: 'only the email', email: true, password: false, enabled: false },
    { fields: 'only the password', email: false, password: true, enabled: false },
    { fields: 'both email and password', email: true, password: true, enabled: true },
  ];
  for (const combination of combinations) {
    test(`UI-AUTH-005 should ${combination.enabled ? 'enable' : 'disable'} Log in with ${combination.fields} filled`, async ({
      loginPage,
      registeredUser,
    }) => {
      await loginPage.goto();

      await loginPage.fillCredentials(
        combination.email ? registeredUser.email : '',
        combination.password ? registeredUser.password : '',
      );

      await expect(loginPage.loginButton).toBeEnabled({ enabled: combination.enabled });
    });
  }
});
