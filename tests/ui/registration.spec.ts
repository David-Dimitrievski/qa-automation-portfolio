import { randomUUID } from 'node:crypto';
import { uniqueEmail } from '../api/support/test-data';
import type { RegistrationForm } from './pages/registration-page';
import { expect, test } from './support/fixtures';

const SECURITY_QUESTION = "Mother's maiden name?";

function validForm(overrides: Partial<RegistrationForm> = {}): RegistrationForm {
  const password = randomUUID();
  return {
    email: uniqueEmail('ui'),
    password,
    repeatPassword: password,
    securityQuestion: SECURITY_QUESTION,
    securityAnswer: randomUUID(),
    ...overrides,
  };
}

test.describe('Registration', () => {
  test.beforeEach(async ({ registrationPage }) => {
    await registrationPage.goto();
  });

  test('UI-REG-001 should register a new customer through the form', async ({
    page,
    registrationPage,
    loginPage,
    notifications,
    authApi,
  }) => {
    const form = validForm();

    await registrationPage.fillForm(form);
    await registrationPage.register();

    await expect(page).toHaveURL(/#\/login$/);
    await expect(loginPage.heading).toBeVisible();
    await expect(
      notifications.message('Registration completed successfully. You can now log in.'),
    ).toBeVisible();

    await test.step('the new account can log in', async () => {
      const response = await authApi.login({ email: form.email, password: form.password });
      expect(response.status()).toBe(200);
    });
  });

  test('UI-REG-002 should disable Register again when the password stops matching', async ({
    registrationPage,
  }) => {
    await registrationPage.fillForm(validForm());
    await expect(registrationPage.registerButton).toBeEnabled();

    await registrationPage.passwordInput.fill(randomUUID());

    await expect(registrationPage.registerButton).toBeDisabled();
    await expect(registrationPage.repeatPasswordInput).toHaveAttribute('aria-invalid', 'true');
    await expect(registrationPage.message('Passwords do not match')).toBeVisible();
  });

  test('UI-REG-003 should require every field once touched', async ({ registrationPage }) => {
    await registrationPage.touchEveryField();

    for (const message of [
      'Please provide an email address.',
      'Please provide a password.',
      'Please repeat your password.',
      'Please select a security question.',
      'Please provide an answer to your security question.',
    ]) {
      await expect.soft(registrationPage.message(message)).toBeVisible();
    }
    await expect(registrationPage.registerButton).toBeDisabled();
  });

  test('UI-REG-004 should not allow registering with a mismatched repeat password', async ({
    registrationPage,
  }) => {
    await registrationPage.fillForm(validForm({ repeatPassword: randomUUID() }));

    await expect(registrationPage.registerButton).toBeDisabled();
    await expect(registrationPage.repeatPasswordInput).toHaveAttribute('aria-invalid', 'true');
    await expect(registrationPage.message('Passwords do not match')).toBeVisible();
  });

  test.describe('password length', () => {
    test('UI-REG-005 should reject a 4-character password', async ({ registrationPage }) => {
      const password = 'a'.repeat(4);

      await registrationPage.fillForm(validForm({ password, repeatPassword: password }));

      await expect(registrationPage.passwordInput).toHaveAttribute('aria-invalid', 'true');
      await expect(
        registrationPage.message('Password must be 5-40 characters long.'),
      ).toBeVisible();
      await expect(registrationPage.registerButton).toBeDisabled();
    });

    for (const length of [5, 40]) {
      test(`UI-REG-005 should accept a ${length}-character password`, async ({
        registrationPage,
      }) => {
        const password = 'a'.repeat(length);

        await registrationPage.fillForm(validForm({ password, repeatPassword: password }));

        await expect(registrationPage.passwordInput).toHaveAttribute('aria-invalid', 'false');
        await expect(registrationPage.registerButton).toBeEnabled();
      });
    }

    test('UI-REG-005 should cut a 41-character password to 40 characters', async ({
      registrationPage,
    }) => {
      await registrationPage.passwordInput.fill('a'.repeat(41));

      await expect(registrationPage.passwordInput).toHaveValue('a'.repeat(40));
    });
  });
});
