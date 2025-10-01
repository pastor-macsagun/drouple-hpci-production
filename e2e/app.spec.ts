import { test, expect } from '@playwright/test';

test('app boots and shows home page', async ({ page }) => {
  await page.goto('/');
  
  await expect(page).toHaveTitle(/Drouple/);
  await expect(page.getByRole('heading', { name: 'Drouple' })).toBeVisible();
  await expect(page.getByText('Ministry made simple.')).toBeVisible();
});

test('auth page renders correctly', async ({ page }) => {
  await page.goto('/auth/signin');
  
  // Fix: Look for the actual heading "Welcome to Drouple" instead of "Sign In"
  await expect(page.getByRole('heading', { name: 'Welcome to Drouple' })).toBeVisible();
  // Fix: Look for the actual text content that exists
  await expect(page.getByText('Sign in to continue')).toBeVisible();
  // Fix: Look for the actual label text that exists
  await expect(page.getByText('Email Address')).toBeVisible();
  // Fix: Look for the actual button text that exists
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});

test('health endpoint returns healthy status', async ({ request }) => {
  const response = await request.get('/api/health');
  
  expect(response.ok()).toBeTruthy();
  
  const json = await response.json();
  expect(json.status).toBe('healthy');
  expect(json.service).toBe('drouple');
});
