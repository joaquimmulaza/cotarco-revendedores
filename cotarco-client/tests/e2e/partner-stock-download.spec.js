import { test, expect } from '@playwright/test';
import { createMockExcelFile } from './helpers/fileHelper';
import path from 'path';
import fs from 'fs';

const partnerState = 'playwright/.auth/partner.json'; // Partner storage state
const adminState = 'playwright/.auth/admin.json'; // Admin storage state for seeding

test.describe('Partner Stock Map Download', () => {
    
  test.use({ storageState: partnerState });

  test('partner should be able to download the active stock map', async ({ page }) => {
    console.log('Navigating to distributor dashboard...');
    await page.goto('/distribuidores/dashboard');
    
    // Search for the "Mapa de Stock" link or section
    const downloadSection = page.getByRole('heading', { name: /Mapas de Stock Disponíveis/i });
    
    // Check sidebar if not directly visible (might be on a different default tab)
    if (!await downloadSection.isVisible()) {
        console.log('Download section not visible, attempting to click "Mapa de Stock" in sidebar...');
        const sidebarLink = page.getByRole('link', { name: 'Mapa de Stock' }).or(page.locator('text=Mapa de Stock'));
        await sidebarLink.click();
    }

    console.log('Waiting for download section visibility...');
    await expect(downloadSection).toBeVisible({ timeout: 15000 });

    // Look for a download button
    const downloadButton = page.getByRole('button', { name: /Baixar Agora/i }).first();
    
    console.log('Waiting for download button to be enabled...');
    await expect(downloadButton).toBeVisible({ timeout: 10000 });
    await expect(downloadButton).toBeEnabled();

    // Handle download
    console.log('Starting download...');
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    // Verify download suggested filename
    const filename = download.suggestedFilename();
    console.log(`Download completed: ${filename}`);
    expect(filename).toMatch(/\.xlsx$/i);
  });


  // Scenario for B2C/B2B isolation could go here if we had multiple partner accounts set up
});
