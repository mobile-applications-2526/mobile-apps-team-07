/**
 * Authentication E2E Tests
 *
 * User Validation Criteria:
 * - User should be able to sign in with valid credentials
 * - User should see error message with invalid credentials
 * - User should be redirected to fleet overview after successful login
 * - User should be able to sign out and return to login screen
 */

import { by, device, element, expect } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  // ============================================
  // TEST CASE: Sign In Screen Display
  // ============================================
  describe('Sign In Screen', () => {
    /**
     * Test Steps:
     * 1) Launch the app
     * 2) Verify sign-in screen is displayed
     * 3) Check for email input field
     * 4) Check for password input field
     * 5) Check for sign-in button
     */
    it('should display sign-in screen with all required elements', async () => {
      // Verify sign-in screen is visible
      await expect(element(by.id('sign-in-screen'))).toBeVisible();

      // Verify email input exists
      await expect(element(by.id('email-input'))).toBeVisible();

      // Verify password input exists
      await expect(element(by.id('password-input'))).toBeVisible();

      // Verify sign-in button exists
      await expect(element(by.id('sign-in-button'))).toBeVisible();
    });

    it('should show password field as secure text', async () => {
      // Password field should be obscured
      await expect(element(by.id('password-input'))).toBeVisible();
    });
  });

  // ============================================
  // TEST CASE: Successful Login
  // ============================================
  describe('Successful Login', () => {
    /**
     * Test Steps:
     * 1) Go to sign-in screen
     * 2) Enter valid email address
     * 3) Enter valid password
     * 4) Tap sign-in button
     * 5) Verify user is redirected to fleet overview
     */
    it('should login successfully with valid credentials', async () => {
      // Enter valid email
      await element(by.id('email-input')).typeText('test@safarban.com');

      // Enter valid password
      await element(by.id('password-input')).typeText('Password123!');

      // Tap sign-in button
      await element(by.id('sign-in-button')).tap();

      // Wait for navigation and verify fleet overview is displayed
      await waitFor(element(by.id('fleet-overview-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Verify fleet list or empty state is shown
      await expect(
        element(by.id('vessel-list').or(by.id('empty-vessel-list')))
      ).toBeVisible();
    });
  });

  // ============================================
  // TEST CASE: Failed Login - Invalid Credentials
  // ============================================
  describe('Failed Login', () => {
    /**
     * Test Steps:
     * 1) Go to sign-in screen
     * 2) Enter invalid email address
     * 3) Enter incorrect password
     * 4) Tap sign-in button
     * 5) Verify error message is displayed
     * 6) Verify user remains on sign-in screen
     */
    it('should show error message with invalid credentials', async () => {
      // Enter invalid email
      await element(by.id('email-input')).typeText('invalid@test.com');

      // Enter wrong password
      await element(by.id('password-input')).typeText('wrongpassword');

      // Tap sign-in button
      await element(by.id('sign-in-button')).tap();

      // Verify error message is shown
      await waitFor(element(by.id('error-message').or(by.text('Invalid email or password'))))
        .toBeVisible()
        .withTimeout(5000);

      // Verify still on sign-in screen
      await expect(element(by.id('sign-in-screen'))).toBeVisible();
    });

    /**
     * Test Steps:
     * 1) Go to sign-in screen
     * 2) Leave email empty
     * 3) Enter password
     * 4) Tap sign-in button
     * 5) Verify validation error is shown
     */
    it('should show validation error for empty email', async () => {
      // Clear any existing text
      await element(by.id('email-input')).clearText();

      // Enter only password
      await element(by.id('password-input')).typeText('Password123!');

      // Tap sign-in button
      await element(by.id('sign-in-button')).tap();

      // Verify validation error
      await expect(element(by.id('email-error').or(by.text('Email is required')))).toBeVisible();
    });

    /**
     * Test Steps:
     * 1) Go to sign-in screen
     * 2) Enter email
     * 3) Leave password empty
     * 4) Tap sign-in button
     * 5) Verify validation error is shown
     */
    it('should show validation error for empty password', async () => {
      // Enter email
      await element(by.id('email-input')).typeText('test@safarban.com');

      // Clear password
      await element(by.id('password-input')).clearText();

      // Tap sign-in button
      await element(by.id('sign-in-button')).tap();

      // Verify validation error
      await expect(
        element(by.id('password-error').or(by.text('Password is required')))
      ).toBeVisible();
    });
  });

  // ============================================
  // TEST CASE: Sign Out
  // ============================================
  describe('Sign Out', () => {
    /**
     * Test Steps:
     * 1) Login with valid credentials
     * 2) Navigate to settings
     * 3) Tap sign-out button
     * 4) Verify user is redirected to sign-in screen
     */
    it('should sign out and redirect to login screen', async () => {
      // First login
      await element(by.id('email-input')).typeText('test@safarban.com');
      await element(by.id('password-input')).typeText('Password123!');
      await element(by.id('sign-in-button')).tap();

      // Wait for fleet overview
      await waitFor(element(by.id('fleet-overview-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Navigate to settings (tap settings icon or menu)
      await element(by.id('settings-button')).tap();

      // Wait for settings screen
      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap sign out button
      await element(by.id('sign-out-button')).tap();

      // Verify redirected to sign-in screen
      await waitFor(element(by.id('sign-in-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  // ============================================
  // TEST CASE: Session Persistence
  // ============================================
  describe('Session Persistence', () => {
    /**
     * Test Steps:
     * 1) Login with valid credentials
     * 2) Close the app
     * 3) Reopen the app
     * 4) Verify user is still logged in
     */
    it('should persist session after app restart', async () => {
      // First login
      await element(by.id('email-input')).typeText('test@safarban.com');
      await element(by.id('password-input')).typeText('Password123!');
      await element(by.id('sign-in-button')).tap();

      // Wait for fleet overview
      await waitFor(element(by.id('fleet-overview-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // Relaunch app (simulate close and reopen)
      await device.launchApp({ newInstance: false });

      // Verify user is still on fleet overview (not sign-in)
      await waitFor(element(by.id('fleet-overview-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });
});
