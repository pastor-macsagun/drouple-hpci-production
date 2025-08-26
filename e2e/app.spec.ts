import { test, expect } from '@playwright/test';

test('app boots and shows home page', async ({ page }) => {
  await page.goto('/');
  
  await expect(page).toHaveTitle(/HPCI ChMS/);
  await expect(page.getByRole('heading', { name: 'HPCI ChMS' })).toBeVisible();
  await expect(page.getByText('Church Management System')).toBeVisible();
});

test('auth page renders correctly', async ({ page }) => {
  await page.goto('/auth/signin');
  
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  await expect(page.getByText('Enter your email to receive a sign-in link')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: /Send Sign-In Link/i })).toBeVisible();
});

test('health endpoint returns healthy status', async ({ request }) => {
  const response = await request.get('/api/health');
  
  expect(response.ok()).toBeTruthy();
  
  const json = await response.json();
  expect(json.status).toBe('healthy');
  expect(json.service).toBe('hpci-chms');
});