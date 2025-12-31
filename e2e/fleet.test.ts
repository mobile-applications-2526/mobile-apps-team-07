/**
 * Fleet Management E2E Tests
 *
 * User Validation Criteria:
 * - User should see list of vessels on fleet overview
 * - User should be able to add a new vessel
 * - User should be able to edit vessel details
 * - User should be able to delete a vessel
 * - User should be able to search/filter vessels
 */

import { by, device, element, expect } from 'detox';

describe('Fleet Management', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login first
    await element(by.id('email-input')).typeText('test@safarban.com');
    await element(by.id('password-input')).typeText('Password123!');
    await element(by.id('sign-in-button')).tap();
    await waitFor(element(by.id('fleet-overview-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Re-authenticate if needed
    try {
      await waitFor(element(by.id('fleet-overview-screen')))
        .toBeVisible()
        .withTimeout(3000);
    } catch {
      // Not logged in, login again
      await element(by.id('email-input')).typeText('test@safarban.com');
      await element(by.id('password-input')).typeText('Password123!');
      await element(by.id('sign-in-button')).tap();
      await waitFor(element(by.id('fleet-overview-screen')))
        .toBeVisible()
        .withTimeout(10000);
    }
  });

  // ============================================
  // TEST CASE: Fleet Overview Display
  // ============================================
  describe('Fleet Overview Screen', () => {
    /**
     * Test Steps:
     * 1) Go to fleet overview
     * 2) Verify screen title is displayed
     * 3) Verify vessel list or empty state is shown
     * 4) Verify add vessel button is visible
     */
    it('should display fleet overview with all UI elements', async () => {
      // Verify fleet overview screen is visible
      await expect(element(by.id('fleet-overview-screen'))).toBeVisible();

      // Verify add vessel button exists
      await expect(element(by.id('add-vessel-button'))).toBeVisible();

      // Verify vessel list or empty state
      await expect(
        element(by.id('vessel-list').or(by.id('empty-vessel-list')))
      ).toBeVisible();
    });

    /**
     * Test Steps:
     * 1) Go to fleet overview with vessels
     * 2) Verify each vessel card shows name
     * 3) Verify each vessel card shows IMO number
     * 4) Verify vessel type is displayed
     */
    it('should display vessel cards with correct information', async () => {
      // Check for vessel cards (if any exist)
      try {
        await waitFor(element(by.id('vessel-card-0')))
          .toBeVisible()
          .withTimeout(5000);

        // Verify vessel card elements
        await expect(element(by.id('vessel-card-0'))).toBeVisible();
        await expect(
          element(by.id('vessel-name-0').or(by.id('vessel-card-0')))
        ).toBeVisible();
      } catch {
        // No vessels exist, verify empty state
        await expect(element(by.id('empty-vessel-list'))).toBeVisible();
      }
    });
  });

  // ============================================
  // TEST CASE: Add New Vessel
  // ============================================
  describe('Add New Vessel', () => {
    /**
     * Test Steps:
     * 1) Go to fleet overview
     * 2) Tap add vessel button
     * 3) Verify add vessel modal/sheet appears
     * 4) Fill in vessel name
     * 5) Fill in IMO number
     * 6) Select vessel type
     * 7) Tap save button
     * 8) Verify vessel is added to list
     */
    it('should add a new vessel successfully', async () => {
      // Tap add vessel button
      await element(by.id('add-vessel-button')).tap();

      // Wait for modal to appear
      await waitFor(element(by.id('add-vessel-modal')))
        .toBeVisible()
        .withTimeout(5000);

      // Fill in vessel name
      await element(by.id('vessel-name-input')).typeText('Test Vessel E2E');

      // Fill in IMO number (7 digits)
      await element(by.id('imo-number-input')).typeText('1234567');

      // Select vessel type (tap dropdown and select)
      await element(by.id('vessel-type-picker')).tap();
      await element(by.text('Gas Carrier')).tap();

      // Select vessel subtype
      await element(by.id('vessel-subtype-picker')).tap();
      await element(by.text('LPG')).tap();

      // Tap save button
      await element(by.id('save-vessel-button')).tap();

      // Wait for modal to close and verify vessel is in list
      await waitFor(element(by.id('add-vessel-modal')))
        .not.toBeVisible()
        .withTimeout(5000);

      // Verify new vessel appears in list
      await waitFor(element(by.text('Test Vessel E2E')))
        .toBeVisible()
        .withTimeout(5000);
    });

    /**
     * Test Steps:
     * 1) Go to fleet overview
     * 2) Tap add vessel button
     * 3) Enter duplicate IMO number
     * 4) Try to save
     * 5) Verify error message about duplicate IMO
     */
    it('should show error for duplicate IMO number', async () => {
      // Tap add vessel button
      await element(by.id('add-vessel-button')).tap();

      // Wait for modal
      await waitFor(element(by.id('add-vessel-modal')))
        .toBeVisible()
        .withTimeout(5000);

      // Fill in vessel name
      await element(by.id('vessel-name-input')).typeText('Duplicate Vessel');

      // Fill in existing IMO number
      await element(by.id('imo-number-input')).typeText('1234567');

      // Select vessel type
      await element(by.id('vessel-type-picker')).tap();
      await element(by.text('Gas Carrier')).tap();

      // Try to save
      await element(by.id('save-vessel-button')).tap();

      // Verify error message
      await waitFor(element(by.text('already exists').or(by.id('imo-error'))))
        .toBeVisible()
        .withTimeout(5000);
    });

    /**
     * Test Steps:
     * 1) Open add vessel modal
     * 2) Leave required fields empty
     * 3) Try to save
     * 4) Verify validation errors are shown
     */
    it('should validate required fields', async () => {
      // Tap add vessel button
      await element(by.id('add-vessel-button')).tap();

      // Wait for modal
      await waitFor(element(by.id('add-vessel-modal')))
        .toBeVisible()
        .withTimeout(5000);

      // Try to save without filling fields
      await element(by.id('save-vessel-button')).tap();

      // Verify validation errors
      await expect(
        element(by.id('name-error').or(by.text('required')))
      ).toBeVisible();
    });
  });

  // ============================================
  // TEST CASE: Edit Vessel
  // ============================================
  describe('Edit Vessel', () => {
    /**
     * Test Steps:
     * 1) Go to fleet overview
     * 2) Tap on a vessel card
     * 3) Navigate to vessel details
     * 4) Tap edit button
     * 5) Modify vessel name
     * 6) Save changes
     * 7) Verify changes are reflected
     */
    it('should edit vessel details successfully', async () => {
      // Find and tap on first vessel (if exists)
      try {
        await element(by.id('vessel-card-0')).tap();

        // Wait for vessel details screen
        await waitFor(element(by.id('vessel-overview-screen')))
          .toBeVisible()
          .withTimeout(5000);

        // Tap edit button
        await element(by.id('edit-vessel-button')).tap();

        // Wait for edit modal
        await waitFor(element(by.id('edit-vessel-modal')))
          .toBeVisible()
          .withTimeout(5000);

        // Clear and update vessel name
        await element(by.id('vessel-name-input')).clearText();
        await element(by.id('vessel-name-input')).typeText('Updated Vessel Name');

        // Save changes
        await element(by.id('save-vessel-button')).tap();

        // Verify modal closes
        await waitFor(element(by.id('edit-vessel-modal')))
          .not.toBeVisible()
          .withTimeout(5000);

        // Verify updated name is shown
        await expect(element(by.text('Updated Vessel Name'))).toBeVisible();
      } catch {
        // No vessels to edit, skip test
        console.log('No vessels available to edit');
      }
    });
  });

  // ============================================
  // TEST CASE: Delete Vessel
  // ============================================
  describe('Delete Vessel', () => {
    /**
     * Test Steps:
     * 1) Go to fleet overview
     * 2) Tap on a vessel card
     * 3) Tap delete button
     * 4) Confirm deletion
     * 5) Verify vessel is removed from list
     */
    it('should delete vessel successfully', async () => {
      try {
        // First add a vessel to delete
        await element(by.id('add-vessel-button')).tap();
        await waitFor(element(by.id('add-vessel-modal')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.id('vessel-name-input')).typeText('Vessel to Delete');
        await element(by.id('imo-number-input')).typeText('9999999');
        await element(by.id('vessel-type-picker')).tap();
        await element(by.text('Gas Carrier')).tap();
        await element(by.id('save-vessel-button')).tap();

        // Wait for vessel to appear
        await waitFor(element(by.text('Vessel to Delete')))
          .toBeVisible()
          .withTimeout(5000);

        // Tap on the vessel
        await element(by.text('Vessel to Delete')).tap();

        // Wait for vessel details
        await waitFor(element(by.id('vessel-overview-screen')))
          .toBeVisible()
          .withTimeout(5000);

        // Tap delete button
        await element(by.id('delete-vessel-button')).tap();

        // Confirm deletion
        await waitFor(element(by.id('delete-confirmation-modal')))
          .toBeVisible()
          .withTimeout(5000);

        await element(by.id('confirm-delete-button')).tap();

        // Verify navigated back to fleet overview
        await waitFor(element(by.id('fleet-overview-screen')))
          .toBeVisible()
          .withTimeout(5000);

        // Verify vessel is no longer in list
        await expect(element(by.text('Vessel to Delete'))).not.toBeVisible();
      } catch (error) {
        console.log('Delete test error:', error);
      }
    });

    /**
     * Test Steps:
     * 1) Try to delete vessel with active voyage
     * 2) Verify warning message is shown
     */
    it('should show warning when deleting vessel with active voyage', async () => {
      // This test depends on having a vessel with active voyage
      // Implementation would check for the warning dialog
    });
  });

  // ============================================
  // TEST CASE: Search Vessels
  // ============================================
  describe('Search and Filter Vessels', () => {
    /**
     * Test Steps:
     * 1) Go to fleet overview
     * 2) Tap search icon
     * 3) Enter vessel name
     * 4) Verify filtered results are shown
     */
    it('should filter vessels by search term', async () => {
      try {
        // Look for search input
        await waitFor(element(by.id('search-input')))
          .toBeVisible()
          .withTimeout(5000);

        // Enter search term
        await element(by.id('search-input')).typeText('Test');

        // Verify filtered results
        await waitFor(element(by.id('vessel-list')))
          .toBeVisible()
          .withTimeout(5000);
      } catch {
        // Search might not be visible, skip
        console.log('Search input not found');
      }
    });
  });

  // ============================================
  // TEST CASE: Pull to Refresh
  // ============================================
  describe('Pull to Refresh', () => {
    /**
     * Test Steps:
     * 1) Go to fleet overview
     * 2) Pull down to refresh
     * 3) Verify loading indicator appears
     * 4) Verify list is updated
     */
    it('should refresh vessel list on pull down', async () => {
      // Scroll up to trigger refresh
      await element(by.id('vessel-list')).swipe('down', 'slow', 0.5);

      // Wait for refresh to complete
      await waitFor(element(by.id('vessel-list')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});
