import type { APIRequestContext, APIResponse } from '@playwright/test';

/** Saved-address and saved-card endpoints, used only to prepare UI test state. */

export interface AddressRequest {
  country: string;
  fullName: string;
  mobileNum: number;
  zipCode: string;
  streetAddress: string;
  city: string;
  state: string;
}

export interface Address extends AddressRequest {
  id: number;
  UserId: number;
}

export interface CardRequest {
  fullName: string;
  cardNum: number;
  expMonth: number;
  expYear: number;
}

export interface Card {
  id: number;
  fullName: string;
  /** The list endpoint returns the number masked, for example `************1111`. */
  cardNum: string | number;
  expMonth: number;
  expYear: number;
}

function bearer(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export class AddressApi {
  constructor(private readonly request: APIRequestContext) {}

  list(token: string): Promise<APIResponse> {
    return this.request.get('/api/Addresss', { headers: bearer(token) });
  }

  create(body: AddressRequest, token: string): Promise<APIResponse> {
    return this.request.post('/api/Addresss', { data: body, headers: bearer(token) });
  }

  remove(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(`/api/Addresss/${id}`, { headers: bearer(token) });
  }
}

export class CardApi {
  constructor(private readonly request: APIRequestContext) {}

  list(token: string): Promise<APIResponse> {
    return this.request.get('/api/Cards', { headers: bearer(token) });
  }

  create(body: CardRequest, token: string): Promise<APIResponse> {
    return this.request.post('/api/Cards', { data: body, headers: bearer(token) });
  }

  remove(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(`/api/Cards/${id}`, { headers: bearer(token) });
  }
}
