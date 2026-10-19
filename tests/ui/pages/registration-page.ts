import type { Locator, Page } from '@playwright/test';

export interface RegistrationForm {
  email: string;
  password: string;
  repeatPassword: string;
  securityQuestion: string;
  securityAnswer: string;
}

export class RegistrationPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly repeatPasswordInput: Locator;
  readonly securityQuestionSelect: Locator;
  readonly securityAnswerInput: Locator;
  readonly registerButton: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByRole('textbox', { name: 'Email address field' });
    this.passwordInput = page.getByRole('textbox', { name: 'Field for the password' });
    this.repeatPasswordInput = page.getByRole('textbox', { name: 'Field to confirm the password' });
    this.securityQuestionSelect = page.getByRole('combobox', {
      name: 'Selection list for the security question',
    });
    this.securityAnswerInput = page.getByRole('textbox', {
      name: 'Field for the answer to the security question',
    });
    this.registerButton = page.getByRole('button', { name: 'Button to complete the registration' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/#/register');
  }

  /** A validation message under one of the fields, by its exact text. */
  message(text: string): Locator {
    return this.page.getByRole('main').getByText(text, { exact: true });
  }

  async chooseSecurityQuestion(question: string): Promise<void> {
    await this.securityQuestionSelect.click();
    await this.page.getByRole('option', { name: question, exact: true }).click();
  }

  async fillForm(form: RegistrationForm): Promise<void> {
    await this.emailInput.fill(form.email);
    await this.passwordInput.fill(form.password);
    await this.repeatPasswordInput.fill(form.repeatPassword);
    await this.chooseSecurityQuestion(form.securityQuestion);
    await this.securityAnswerInput.fill(form.securityAnswer);
  }

  /** Focuses and leaves every required field without typing, so each one is marked touched. */
  async touchEveryField(): Promise<void> {
    for (const field of [
      this.emailInput,
      this.passwordInput,
      this.repeatPasswordInput,
      this.securityQuestionSelect,
      this.securityAnswerInput,
    ]) {
      await field.focus();
      await field.blur();
    }
  }

  async register(): Promise<void> {
    await this.registerButton.click();
  }
}
