import type { BrowserContext, Page } from '@playwright/test';

/** Reads where the app keeps the login session in the browser. */

export function storedToken(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('token'));
}

export async function tokenCookie(context: BrowserContext): Promise<string | undefined> {
  const cookies = await context.cookies();
  return cookies.find((cookie) => cookie.name === 'token')?.value;
}
