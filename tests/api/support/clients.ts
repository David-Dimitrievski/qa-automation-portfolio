import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { BasketItemRequest, RegistrationRequest } from './test-data';
import type { Credentials } from './types';

export async function readJson<T>(response: APIResponse): Promise<T> {
  return (await response.json()) as T;
}

function bearer(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class AuthApi {
  constructor(private readonly request: APIRequestContext) {}

  register(body: RegistrationRequest): Promise<APIResponse> {
    return this.request.post('/api/Users', { data: body });
  }

  login(body: Partial<Credentials>): Promise<APIResponse> {
    return this.request.post('/rest/user/login', { data: body });
  }

  /** whoami reads the session from the `token` cookie, not from the Authorization header. */
  whoAmI(token?: string): Promise<APIResponse> {
    return this.request.get('/rest/user/whoami', {
      headers: token ? { Cookie: `token=${token}` } : {},
    });
  }
}

export class ProductsApi {
  constructor(private readonly request: APIRequestContext) {}

  list(): Promise<APIResponse> {
    return this.request.get('/api/Products');
  }

  get(id: number | string): Promise<APIResponse> {
    return this.request.get(`/api/Products/${id}`);
  }

  search(query: string): Promise<APIResponse> {
    return this.request.get('/rest/products/search', { params: { q: query } });
  }
}

export class BasketApi {
  constructor(private readonly request: APIRequestContext) {}

  get(basketId: number, token?: string): Promise<APIResponse> {
    return this.request.get(`/rest/basket/${basketId}`, { headers: bearer(token) });
  }

  addItem(item: BasketItemRequest, token?: string): Promise<APIResponse> {
    return this.request.post('/api/BasketItems', { data: item, headers: bearer(token) });
  }

  /** Sends the body verbatim, for malformed-payload cases. */
  addItemRaw(rawBody: string, token: string): Promise<APIResponse> {
    return this.request.post('/api/BasketItems', {
      // A Buffer is sent as-is; a string with a JSON content type would be re-encoded as a JSON string.
      data: Buffer.from(rawBody),
      headers: { ...bearer(token), 'Content-Type': 'application/json' },
    });
  }

  updateQuantity(itemId: number, quantity: number, token: string): Promise<APIResponse> {
    return this.request.put(`/api/BasketItems/${itemId}`, {
      data: { quantity },
      headers: bearer(token),
    });
  }

  removeItem(itemId: number, token: string): Promise<APIResponse> {
    return this.request.delete(`/api/BasketItems/${itemId}`, { headers: bearer(token) });
  }
}
