import { test as base, expect } from '@playwright/test';
import { AuthApi, BasketApi, ProductsApi, readJson } from './clients';
import { newRegistration, uniqueEmail } from './test-data';
import type { Envelope, LoginResponse, RegisteredUser, SessionUser, User } from './types';

/** Registers a fresh user; the prefix tells which suite created it (API by default). */
export async function registerUser(authApi: AuthApi, emailPrefix = 'api'): Promise<RegisteredUser> {
  const email = uniqueEmail(emailPrefix);
  const registration = newRegistration({ email });
  const response = await authApi.register(registration);
  expect(response.status(), 'register a fresh user').toBe(201);
  const { data } = await readJson<Envelope<User>>(response);
  return { id: data.id, email, password: registration.password };
}

export async function logIn(authApi: AuthApi, user: RegisteredUser): Promise<SessionUser> {
  const response = await authApi.login({ email: user.email, password: user.password });
  expect(response.status(), 'log in the fresh user').toBe(200);
  const { authentication } = await readJson<LoginResponse>(response);
  return { ...user, token: authentication.token, basketId: authentication.bid };
}

interface ApiFixtures {
  authApi: AuthApi;
  /** AuthApi on a brand-new request context, so no cookie or header can carry over. */
  anonymousAuthApi: AuthApi;
  productsApi: ProductsApi;
  basketApi: BasketApi;
  /** A freshly registered user who has not logged in yet. */
  registeredUser: RegisteredUser;
  /** A freshly registered, logged-in user with an empty basket. */
  user: SessionUser;
  /** A second, independent logged-in user for cross-user (authorization) cases. */
  otherUser: SessionUser;
}

export const test = base.extend<ApiFixtures>({
  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
  },
  anonymousAuthApi: async ({ playwright, baseURL }, use) => {
    const context = await playwright.request.newContext({ baseURL });
    await use(new AuthApi(context));
    await context.dispose();
  },
  productsApi: async ({ request }, use) => {
    await use(new ProductsApi(request));
  },
  basketApi: async ({ request }, use) => {
    await use(new BasketApi(request));
  },
  registeredUser: async ({ authApi }, use) => {
    await use(await registerUser(authApi));
  },
  user: async ({ authApi }, use) => {
    await use(await logIn(authApi, await registerUser(authApi)));
  },
  otherUser: async ({ authApi }, use) => {
    await use(await logIn(authApi, await registerUser(authApi)));
  },
});

export { expect };
