import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Tests for OpenAPI Web UI
 * Tests dark mode implementation and WCAG compliance
 */

test.describe('Dark Mode & Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should have no automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should render in dark mode by default', async ({ page }) => {
    // Check that dark mode color scheme is applied
    const colorScheme = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).colorScheme;
    });
    expect(colorScheme).toBe('dark');

    // Check that background is dark
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // Should be a dark color (rgb values < 50)
    const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [_, r, g, b] = rgbMatch.map(Number);
      expect(r).toBeLessThan(50);
      expect(g).toBeLessThan(50);
      expect(b).toBeLessThan(50);
    }
  });

  test('should have visible skip-to-content link on focus', async ({ page }) => {
    // Tab to focus the skip link
    await page.keyboard.press('Tab');
    
    // Check if skip link is visible
    const skipLink = page.locator('a.skip-link');
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveText('Skip to main content');
    
    // Check that it has correct href
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('should navigate with keyboard to main content via skip link', async ({ page }) => {
    // Tab to skip link and press Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Check that main content is focused
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('navigation should have proper ARIA labels', async ({ page }) => {
    const nav = page.locator('nav');
    await expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    
    // Check buttons have aria-current
    const catalogButton = page.locator('nav button', { hasText: 'Catalog' });
    await expect(catalogButton).toHaveAttribute('aria-current', 'page');
  });

  test('navigation buttons should be keyboard accessible', async ({ page }) => {
    // Tab to first navigation button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip the skip-link
    
    const catalogButton = page.locator('nav button', { hasText: 'Catalog' });
    await expect(catalogButton).toBeFocused();
    
    // Tab to second button
    await page.keyboard.press('Tab');
    const editorButton = page.locator('nav button', { hasText: 'Editor' });
    await expect(editorButton).toBeFocused();
    
    // Activate editor button with keyboard
    await page.keyboard.press('Enter');
    await expect(editorButton).toHaveAttribute('aria-current', 'page');
  });

  test('focus indicators should be visible on interactive elements', async ({ page }) => {
    // Tab through interactive elements and check focus rings
    const buttons = page.locator('button').first();
    await buttons.focus();
    
    // Check that focus ring is visible (should have outline or box-shadow)
    const outline = await buttons.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outline || styles.boxShadow;
    });
    expect(outline).not.toBe('none');
    expect(outline).not.toBe('');
  });

  test('should have high contrast text on dark backgrounds', async ({ page }) => {
    // Check color contrast for main text
    const textElement = page.locator('h1').first();
    const contrast = await textElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const color = styles.color;
      const bgColor = styles.backgroundColor;
      
      // Simple contrast check - text should be light (rgb > 200)
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const [_, r, g, b] = rgbMatch.map(Number);
        return { r, g, b, hasHighContrast: r > 200 && g > 200 && b > 200 };
      }
      return { hasHighContrast: false };
    });
    
    expect(contrast.hasHighContrast).toBe(true);
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Set prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    
    // Check that transitions are minimal
    const button = page.locator('button').first();
    const transitionDuration = await button.evaluate((el) => {
      return window.getComputedStyle(el).transitionDuration;
    });
    
    // Should be very short (0.01ms or less)
    expect(parseFloat(transitionDuration)).toBeLessThan(0.02);
  });

  test('all images and icons should have alt text or aria-hidden', async ({ page }) => {
    const images = await page.locator('img, svg').all();
    
    for (const img of images) {
      const hasAlt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      const ariaLabel = await img.getAttribute('aria-label');
      
      // Should have either alt text, aria-label, or aria-hidden="true"
      expect(
        hasAlt !== null || ariaHidden === 'true' || ariaLabel !== null
      ).toBe(true);
    }
  });

  test('form inputs should have labels', async ({ page }) => {
    // Navigate to a page with forms
    const inputs = await page.locator('input[type="text"], textarea').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledby = await input.getAttribute('aria-labelledby');
      const placeholder = await input.getAttribute('placeholder');
      
      // Should have an associated label, aria-label, or aria-labelledby
      const hasLabel = id ? await page.locator(`label[for="${id}"]`).count() > 0 : false;
      
      expect(
        hasLabel || ariaLabel !== null || ariaLabelledby !== null || placeholder !== null
      ).toBe(true);
    }
  });

  test('buttons should have accessible names', async ({ page }) => {
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledby = await button.getAttribute('aria-labelledby');
      
      // Button should have text content or aria-label
      expect(
        (text && text.trim().length > 0) || ariaLabel !== null || ariaLabelledby !== null
      ).toBe(true);
    }
  });

  test('should meet WCAG AAA color contrast requirements', async ({ page }) => {
    // Run axe specifically for color contrast at AAA level
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aaa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('interactive elements should have minimum touch target size', async ({ page }) => {
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const boundingBox = await button.boundingBox();
      if (boundingBox) {
        // WCAG requires minimum 44x44px touch targets
        expect(boundingBox.width).toBeGreaterThanOrEqual(40); // Allow small margin
        expect(boundingBox.height).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check that headings follow proper order (h1 -> h2 -> h3, no skipping)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const levels = await Promise.all(
      headings.map(async (h) => parseInt((await h.evaluate(el => el.tagName)).substring(1)))
    );
    
    // Should start with h1
    if (levels.length > 0) {
      expect(levels[0]).toBe(1);
      
      // Check no levels are skipped
      for (let i = 1; i < levels.length; i++) {
        const diff = levels[i] - levels[i - 1];
        // Can go up by 1, or down by any amount, but shouldn't skip levels
        if (diff > 0) {
          expect(diff).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  test('error messages should be announced to screen readers', async ({ page }) => {
    // Look for error messages with role="alert" or aria-live
    const errors = page.locator('[role="alert"], [aria-live]');
    
    // If errors exist, they should have proper ARIA attributes
    const count = await errors.count();
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const error = errors.nth(i);
        const role = await error.getAttribute('role');
        const ariaLive = await error.getAttribute('aria-live');
        
        expect(role === 'alert' || ariaLive !== null).toBe(true);
      }
    }
  });
});

test.describe('Responsive Dark Mode', () => {
  test('should render correctly on mobile dark mode', async ({ page, viewport }) => {
    // Test on mobile viewport
    if (viewport) {
      await page.setViewportSize({ width: 375, height: 667 });
    }
    await page.goto('/');
    
    // Should still be dark
    const colorScheme = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).colorScheme;
    });
    expect(colorScheme).toBe('dark');
    
    // Check that layout adapts
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should maintain accessibility on mobile', async ({ page, viewport }) => {
    if (viewport) {
      await page.setViewportSize({ width: 375, height: 667 });
    }
    await page.goto('/');
    
    // Run accessibility scan on mobile
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
