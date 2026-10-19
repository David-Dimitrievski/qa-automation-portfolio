import { test as base, expect } from '@playwright/test';
import { logIn, registerUser } from '../../api/support/fixtures';
import { AuthApi, BasketApi, ProductsApi, readJson } from '../../api/support/clients';
import type { Envelope, Product, RegisteredUser, SessionUser } from '../../api/support/types';
import { AddressFormPage } from '../pages/address-form-page';
import { AddressSelectPage } from '../pages/address-select-page';
import { BasketPage } from '../pages/basket-page';
import { CheckoutFlow } from '../pages/checkout-flow';
import { DeliveryMethodPage } from '../pages/delivery-method-page';
import { Header } from '../pages/header';
import { LoginPage } from '../pages/login-page';
import { Notifications } from '../pages/notifications';
import { OrderCompletionPage } from '../pages/order-completion-page';
import { OrderSummaryPage } from '../pages/order-summary-page';
import { PaymentPage } from '../pages/payment-page';
import { ProductListPage } from '../pages/product-list-page';
import { RegistrationPage } from '../pages/registration-page';
import { AddressApi, CardApi, type Address, type Card } from './setup-api';
import { newAddress, newCard } from './test-data';

const EMAIL_PREFIX = 'ui';

/** Marks a tab whose browser storage was already seeded, so a reload after logout stays logged out. */
const SESSION_SEEDED_MARKER = 'ui-test-session-seeded';

/** Product lookup by name, so specs never hardcode ids or prices. */
export interface Catalog {
  product(name: string): Promise<Product>;
}

/** API shortcuts that prepare the logged-in user's data before the UI is opened. */
export interface Seeder {
  basketItem(productName: string, quantity?: number): Promise<void>;
  address(): Promise<Address>;
  card(): Promise<Card>;
}

interface UiFixtures {
  authApi: AuthApi;
  productsApi: ProductsApi;
  basketApi: BasketApi;
  addressApi: AddressApi;
  cardApi: CardApi;
  /** Dismisses the welcome banner and cookie notice and fixes the language to English. */
  appPreferences: void;
  /** A freshly registered user who has not logged in yet. */
  registeredUser: RegisteredUser;
  /** A freshly registered user logged in through the API only. Its saved addresses and cards are removed afterwards. */
  user: SessionUser;
  catalog: Catalog;
  seed: Seeder;
  header: Header;
  notifications: Notifications;
  loginPage: LoginPage;
  registrationPage: RegistrationPage;
  productList: ProductListPage;
  basketPage: BasketPage;
  addressSelectPage: AddressSelectPage;
  addressFormPage: AddressFormPage;
  deliveryMethodPage: DeliveryMethodPage;
  paymentPage: PaymentPage;
  orderSummaryPage: OrderSummaryPage;
  orderCompletionPage: OrderCompletionPage;
  checkout: CheckoutFlow;
}

export const test = base.extend<UiFixtures>({
  authApi: async ({ request }, use) => {
    await use(new AuthApi(request));
  },
  productsApi: async ({ request }, use) => {
    await use(new ProductsApi(request));
  },
  basketApi: async ({ request }, use) => {
    await use(new BasketApi(request));
  },
  addressApi: async ({ request }, use) => {
    await use(new AddressApi(request));
  },
  cardApi: async ({ request }, use) => {
    await use(new CardApi(request));
  },

  appPreferences: [
    async ({ context, baseURL }, use) => {
      await context.addCookies([
        { name: 'welcomebanner_status', value: 'dismiss', url: baseURL },
        { name: 'cookieconsent_status', value: 'dismiss', url: baseURL },
        { name: 'language', value: 'en', url: baseURL },
      ]);
      await use();
    },
    { auto: true },
  ],

  registeredUser: async ({ authApi }, use) => {
    await use(await registerUser(authApi, EMAIL_PREFIX));
  },

  user: async ({ authApi, addressApi, cardApi }, use) => {
    const user = await logIn(authApi, await registerUser(authApi, EMAIL_PREFIX));
    await use(user);

    // Clean up what the test saved, through the API or the UI.
    const addresses = await addressApi.list(user.token);
    expect(addresses.status(), 'list saved addresses for cleanup').toBe(200);
    for (const address of (await readJson<Envelope<Address[]>>(addresses)).data) {
      expect((await addressApi.remove(address.id, user.token)).status(), 'delete address').toBe(
        200,
      );
    }
    const cards = await cardApi.list(user.token);
    expect(cards.status(), 'list saved cards for cleanup').toBe(200);
    for (const card of (await readJson<Envelope<Card[]>>(cards)).data) {
      expect((await cardApi.remove(card.id, user.token)).status(), 'delete card').toBe(200);
    }
  },

  catalog: async ({ productsApi }, use) => {
    let products: Product[] | undefined;
    await use({
      async product(name) {
        if (!products) {
          const response = await productsApi.list();
          expect(response.status(), 'list products').toBe(200);
          products = (await readJson<Envelope<Product[]>>(response)).data;
        }
        const product = products.find((candidate) => candidate.name === name);
        expect(product, `seed product "${name}" exists`).toBeDefined();
        return product as Product;
      },
    });
  },

  seed: async ({ user, catalog, basketApi, addressApi, cardApi }, use) => {
    await use({
      async basketItem(productName, quantity = 1) {
        const product = await catalog.product(productName);
        const response = await basketApi.addItem(
          { ProductId: product.id, BasketId: String(user.basketId), quantity },
          user.token,
        );
        expect(response.status(), `add ${productName} to the basket`).toBe(200);
      },
      async address() {
        const response = await addressApi.create(newAddress(), user.token);
        expect(response.status(), 'save an address').toBe(201);
        return (await readJson<Envelope<Address>>(response)).data;
      },
      async card() {
        const response = await cardApi.create(newCard(), user.token);
        expect(response.status(), 'save a card').toBe(201);
        return (await readJson<Envelope<Card>>(response)).data;
      },
    });
  },

  header: async ({ page }, use) => {
    await use(new Header(page));
  },
  notifications: async ({ page }, use) => {
    await use(new Notifications(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },
  productList: async ({ page }, use) => {
    await use(new ProductListPage(page));
  },
  basketPage: async ({ page }, use) => {
    await use(new BasketPage(page));
  },
  addressSelectPage: async ({ page }, use) => {
    await use(new AddressSelectPage(page));
  },
  addressFormPage: async ({ page }, use) => {
    await use(new AddressFormPage(page));
  },
  deliveryMethodPage: async ({ page }, use) => {
    await use(new DeliveryMethodPage(page));
  },
  paymentPage: async ({ page }, use) => {
    await use(new PaymentPage(page));
  },
  orderSummaryPage: async ({ page }, use) => {
    await use(new OrderSummaryPage(page));
  },
  orderCompletionPage: async ({ page }, use) => {
    await use(new OrderCompletionPage(page));
  },
  checkout: async ({ page }, use) => {
    await use(new CheckoutFlow(page));
  },
});

/**
 * Same fixtures, with `user` also logged in in the browser before the first navigation.
 * Use it for features behind login; the test reads the account from the `user` fixture.
 */
export const loggedInTest = test.extend<{ browserSession: void }>({
  browserSession: [
    async ({ context, baseURL, user }, use) => {
      await context.addCookies([{ name: 'token', value: user.token, url: baseURL }]);
      // Runs before the app on every navigation, but seeds storage only once per tab: a later
      // reload after a UI logout must not log the user back in.
      await context.addInitScript(
        ({ token, basketId, marker }) => {
          if (sessionStorage.getItem(marker) === null) {
            localStorage.setItem('token', token);
            sessionStorage.setItem('bid', basketId);
            sessionStorage.setItem(marker, 'true');
          }
        },
        { token: user.token, basketId: String(user.basketId), marker: SESSION_SEEDED_MARKER },
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };
