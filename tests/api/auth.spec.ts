import { randomUUID } from 'node:crypto';
import { readJson } from './support/clients';
import { expect, test } from './support/fixtures';
import { expectBasketSchema, expectJwtShape, expectUserSchema } from './support/schemas';
import { newRegistration, uniqueEmail } from './support/test-data';
import type {
  Basket,
  Envelope,
  LoginResponse,
  User,
  ValidationError,
  WhoAmIResponse,
} from './support/types';

const INVALID_LOGIN_MESSAGE = 'Invalid email or password.';

test.describe('POST /api/Users (registration)', () => {
  test('API-AUTH-001 should register a customer with a valid payload', async ({ authApi }) => {
    const email = uniqueEmail();

    const response = await authApi.register(newRegistration({ email }));

    expect(response.status()).toBe(201);
    const body = await readJson<Envelope<User>>(response);
    expect(body.status).toBe('success');
    expectUserSchema(body.data);
    expect(body.data).toMatchObject({
      email,
      role: 'customer',
      isActive: true,
      deletedAt: null,
    });
  });

  test('API-AUTH-002 should reject a duplicate email', async ({ authApi, registeredUser }) => {
    const response = await authApi.register(newRegistration({ email: registeredUser.email }));

    expect(response.status()).toBe(400);
    expect(await readJson<ValidationError>(response)).toEqual({
      message: 'Validation error',
      errors: [{ field: 'email', message: 'email must be unique' }],
    });
  });

  // Security control (OWASP WSTG-BUSL-01): the email must be a valid address.
  test(
    'API-AUTH-003 should reject an email without an @ sign',
    { tag: '@security-control' },
    async ({ authApi }) => {
      const email = `notanemail-${randomUUID()}`;

      const response = await authApi.register(newRegistration({ email }));

      expect(response.status()).toBe(400);
      const body = await readJson<ValidationError>(response);
      expect(body.errors).toContainEqual(expect.objectContaining({ field: 'email' }));
    },
  );

  // Security control (OWASP WSTG-BUSL-01): the email is a required field.
  test(
    'API-AUTH-004 should reject a registration without an email',
    { tag: '@security-control' },
    async ({ authApi }) => {
      const response = await authApi.register(newRegistration({ email: undefined }));

      expect(response.status()).toBe(400);
      const body = await readJson<ValidationError>(response);
      expect(body.errors).toContainEqual(expect.objectContaining({ field: 'email' }));
    },
  );

  // Security control (OWASP API3:2023 BOPLA, mass assignment): a client cannot choose its own
  // role; the privileged field is ignored and the account is created as a customer.
  test(
    'API-AUTH-005 should ignore a self-assigned admin role',
    { tag: '@security-control' },
    async ({ authApi }) => {
      const response = await authApi.register(newRegistration({ role: 'admin' }));

      expect(response.status()).toBe(201);
      const { data } = await readJson<Envelope<User>>(response);
      expectUserSchema(data);
      expect(data.role).toBe('customer');
    },
  );
});

test.describe('POST /rest/user/login', () => {
  test('API-AUTH-006 should return a token and basket id for valid credentials', async ({
    authApi,
    registeredUser,
  }) => {
    const response = await authApi.login({
      email: registeredUser.email,
      password: registeredUser.password,
    });

    expect(response.status()).toBe(200);
    const { authentication } = await readJson<LoginResponse>(response);
    expectJwtShape(authentication.token);
    expect(authentication.bid).toEqual(expect.any(Number));
    expect(authentication.umail).toBe(registeredUser.email);
  });

  // Security control (OWASP API2:2023 Broken Authentication): a wrong password is rejected.
  test(
    'API-AUTH-007 should reject a wrong password',
    { tag: '@security-control' },
    async ({ authApi, registeredUser }) => {
      const response = await authApi.login({ email: registeredUser.email, password: randomUUID() });

      expect(response.status()).toBe(401);
      expect(await response.text()).toBe(INVALID_LOGIN_MESSAGE);
    },
  );

  // Security control (OWASP API2:2023 Broken Authentication, WSTG-IDNT-04): an unknown email
  // gets the same response as a wrong password, so accounts cannot be enumerated.
  test(
    'API-AUTH-008 should reject an unknown email with the same message',
    { tag: '@security-control' },
    async ({ authApi }) => {
      const response = await authApi.login({ email: uniqueEmail(), password: randomUUID() });

      expect(response.status()).toBe(401);
      expect(await response.text()).toBe(INVALID_LOGIN_MESSAGE);
    },
  );

  // Security control (OWASP API2:2023 Broken Authentication): incomplete credentials are rejected.
  test(
    'API-AUTH-009 should reject incomplete credentials with the same message',
    { tag: '@security-control' },
    async ({ authApi }) => {
      await test.step('empty body', async () => {
        const response = await authApi.login({});

        expect(response.status()).toBe(401);
        expect(await response.text()).toBe(INVALID_LOGIN_MESSAGE);
      });

      await test.step('missing password', async () => {
        const response = await authApi.login({ email: uniqueEmail() });

        expect(response.status()).toBe(401);
        expect(await response.text()).toBe(INVALID_LOGIN_MESSAGE);
      });
    },
  );
});

test.describe('Bearer token on a protected route', () => {
  // Security control (OWASP API2:2023 Broken Authentication): a forged token is rejected.
  test(
    'API-AUTH-010 should reject a forged JWT-shaped token',
    { tag: '@security-control' },
    async ({ basketApi, user }) => {
      const response = await basketApi.get(user.basketId, 'abc.def.ghi');

      expect(response.status()).toBe(401);
    },
  );

  test('API-AUTH-011 should accept a valid token', async ({ basketApi, user }) => {
    const response = await basketApi.get(user.basketId, user.token);

    expect(response.status()).toBe(200);
    const { data } = await readJson<Envelope<Basket>>(response);
    expectBasketSchema(data);
    expect(data.id).toBe(user.basketId);
  });
});

test.describe('GET /rest/user/whoami', () => {
  test('API-AUTH-012 should identify the user from the token cookie', async ({ authApi, user }) => {
    const response = await authApi.whoAmI(user.token);

    expect(response.status()).toBe(200);
    const body = await readJson<WhoAmIResponse>(response);
    expect(body.user).toMatchObject({ id: expect.any(Number), email: user.email });
    expect(body.user).not.toHaveProperty('password');
  });

  test('API-AUTH-013 should return an empty user without a session', async ({
    anonymousAuthApi,
  }) => {
    const response = await anonymousAuthApi.whoAmI();

    expect(response.status()).toBe(200);
    expect(await readJson<WhoAmIResponse>(response)).toEqual({ user: {} });
  });
});
