/** Response shapes of the Juice Shop endpoints under test (only the fields the suite relies on). */

export interface Envelope<T> {
  status: 'success';
  data: T;
}

export interface ValidationError {
  message: string;
  errors: { field: string; message: string }[];
}

export interface User {
  id: number;
  email: string | null;
  role: string;
  isActive: boolean;
  deletedAt: string | null;
}

export interface LoginResponse {
  authentication: { token: string; bid: number; umail: string };
}

export interface WhoAmIResponse {
  user: { id?: number; email?: string };
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  deluxePrice: number;
  image: string;
  alternateImages: unknown[];
}

export interface BasketItem {
  id: number;
  ProductId: number;
  BasketId: string | number;
  quantity: number;
}

export interface Basket {
  id: number;
  UserId: number;
  coupon: string | null;
  Products: (Product & { BasketItem: BasketItem })[];
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisteredUser extends Credentials {
  id: number;
}

export interface SessionUser extends RegisteredUser {
  token: string;
  basketId: number;
}
