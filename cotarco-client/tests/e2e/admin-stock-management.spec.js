import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { createMockExcelFile } from './helpers/fileHelper';

const adminState = 'playwright/.auth/admin.json';

test.describe('Admin Stock Map Management', () => {
  test.use({ storageState: adminState });

  const tempFilePath = path.resolve('tests/e2e/temp-stock-file.xlsx');
  let dynamicTestData = null;

  test.beforeAll(async () => {
    const realExcelPath = 'C:\\cotarco-revendedores\\Cotarco - Tabela de Stocks.xlsx';
    if (fs.existsSync(realExcelPath)) {
      fs.copyFileSync(realExcelPath, tempFilePath);
      
      // Extract dynamic test data from the real file
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(realExcelPath);
      const sheet = workbook.getWorksheet(1);
      
      let skuCol = -1;
      let priceCol = -1;
      let stockCol = -1;
      let headerRow = -1;

      // Find headers (scan first 20 rows)
      for (let i = 1; i <= 20; i++) {
        const row = sheet.getRow(i);
        row.eachCell((cell, colNumber) => {
          const val = cell.text?.toLowerCase() || '';
          if (val.includes('referencia') || val.includes('sku')) skuCol = colNumber;
          if (val.includes('preço') || val.includes('preco')) priceCol = colNumber;
          if (val.includes('qtd total')) stockCol = colNumber;
        });
        if (skuCol !== -1 && priceCol !== -1 && stockCol !== -1) {
          headerRow = i;
          break;
        }
      }

      if (headerRow !== -1) {
        // Find first row with data
        for (let i = headerRow + 1; i <= sheet.rowCount; i++) {
          const row = sheet.getRow(i);
          const sku = row.getCell(skuCol).text?.trim();
          const priceStr = row.getCell(priceCol).text?.trim();
          const stockStr = row.getCell(stockCol).text?.trim();

          if (sku && priceStr && !isNaN(parseFloat(priceStr.replace(/,/g, '')))) {
            dynamicTestData = {
              sku,
              price: parseFloat(priceStr.replace(/,/g, '')),
              stock: parseInt(stockStr.replace(/,/g, '')) || 0
            };
            console.log(`Dynamic test data extracted: SKU=${sku}, Price=${dynamicTestData.price}, Stock=${dynamicTestData.stock}`);
            break;
          }
        }
      }
    } else {
      await createMockExcelFile(tempFilePath);
    }
  });

  test.afterAll(async () => {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  test('should upload, toggle and delete a stock file', async ({ page }) => {
    // 1. Navigate to Stock Management
    await page.goto('/distribuidores/admin/dashboard');
    
    const stockManagementHeading = page.getByRole('heading', { name: 'Gestão do Mapa de Stock' });
    
    // Sidebar link is 'Mapa de Stock' according to subagent
    if (!await stockManagementHeading.isVisible()) {
        await page.click('text=Mapa de Stock');
    }

    await expect(stockManagementHeading).toBeVisible();

    // 2. Upload File
    const displayName = `E2E Test Stock ${Date.now()}`;
    
    console.log(`Starting upload process with display name: ${displayName}`);

    // Detect if we are in the "empty list" state or "add more" state
    const isListEmpty = await page.locator('#stock-file-input').isVisible();
    
    // Naming in StockFileManager is slightly inconsistent:
    // Empty: stock-file-input, display-name, target-business-model
    // Replace: replace-file-input, replace-display-name, replace-target-business-model
    const fileInputSelector = isListEmpty ? '#stock-file-input' : '#replace-file-input';
    const nameInputSelector = isListEmpty ? '#display-name' : '#replace-display-name';
    const modelSelectSelector = isListEmpty ? '#target-business-model' : '#replace-target-business-model';

    console.log(`Using selectors: ${fileInputSelector}, ${nameInputSelector}, ${modelSelectSelector}`);

    // Ensure the input is visible
    await page.waitForSelector(fileInputSelector, { state: 'visible' });

    await page.setInputFiles(fileInputSelector, tempFilePath);
    await page.fill(nameInputSelector, displayName);
    await page.selectOption(modelSelectSelector, 'B2B');
    
    // Button text changes based on list state: "Carregar Mapa" or "Adicionar Ficheiro"
    const submitButton = page.getByRole('button', { name: /Carregar Mapa|Adicionar Ficheiro/i });
    
    // Ensure button is enabled before clicking
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    console.log('Upload button clicked, waiting for success message...');

    // 3. Verify Upload Success
    const successMessage = page.getByText('Ficheiro de stock carregado com sucesso!');
    const errorMessage = page.locator('.text-red-700, .bg-red-100');

    await Promise.race([
        successMessage.waitFor({ state: 'visible', timeout: 20000 }),
        errorMessage.waitFor({ state: 'visible', timeout: 20000 }).then(async () => {
            const text = await page.locator('.text-red-700, .bg-red-100').first().innerText();
            throw new Error(`Upload failed with error: ${text}`);
        })
    ]).catch(err => {
        if (err.name === 'TimeoutError') {
            throw new Error('Timeout waiting for upload success message. Check if the backend is processing the file or index.js is returning an error.');
        }
        throw err;
    });

    console.log('Upload successful!');
    
    // Verify the file appears in the table.
    // Note: The table might take a moment to refresh after upload
    const fileRow = page.locator('tr').filter({ hasText: displayName }).last(); 
    await expect(fileRow).toBeVisible({ timeout: 10000 });

    // 4. Verify Imported Prices and Stock (Dynamic UI Verification)
    if (dynamicTestData) {
        const priceColumnIndex = 6; // B2B is 6th td
        console.log(`Verifying database import via UI for SKU: ${dynamicTestData.sku} (Checking column ${priceColumnIndex})...`);
        await page.goto('/distribuidores/admin/dashboard/product-list');
        
        // Wait for search input
        const searchInput = page.locator('input[placeholder*="Pesquisar produtos"]');
        await expect(searchInput).toBeVisible();
        
        // Search for SKU
        await searchInput.fill(dynamicTestData.sku);
        await page.waitForTimeout(1000); // Give a moment for debounced search

        // Find the row with the SKU
        const productRow = page.locator('tbody tr').filter({ hasText: dynamicTestData.sku }).first();
        await expect(productRow).toBeVisible({ timeout: 10000 });

        // Wait for Price (6th column) to not be "N/D" (Job takes time)
        const priceCell = productRow.locator('td').nth(priceColumnIndex - 1);
        console.log(`Waiting for job to update price for ${dynamicTestData.sku}...`);
        await expect(priceCell).not.toHaveText('N/D', { timeout: 30000 });
        
        const priceText = await priceCell.innerText();
        console.log(`UI Price for ${dynamicTestData.sku}: ${priceText}`);
        
        // Clean price text: remove "Kz" and spaces, replace comma with dot
        const cleanedPrice = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.'));
        expect(cleanedPrice).toBeCloseTo(dynamicTestData.price, 2);

        // Check Stock (7th column)
        const stockCell = productRow.locator('td').nth(6);
        const stockText = await stockCell.innerText();
        console.log(`UI Stock for ${dynamicTestData.sku}: ${stockText}`);
        
        const cleanedStock = parseInt(stockText.replace(/[^\d]/g, ''));
        expect(cleanedStock).toBe(dynamicTestData.stock);
        
        console.log('Dynamic UI verification successful!');

        // Go back to the stock manager to clean up (delete the file)
        await page.goto('/distribuidores/admin/dashboard/stock-files');
        // Re-locate the file row by name
        const freshFileRow = page.locator('tr').filter({ hasText: displayName }).last();
        await expect(freshFileRow).toBeVisible();
    }

    // 5. Toggle Status (Active/Inactive)
    const initialStatus = await fileRow.locator('span.rounded-full').innerText();
    const toggleButton = fileRow.getByRole('button', { name: /Ativar|Desativar/i });
    
    await toggleButton.click();
    
    // Confirm in dialog - the button text matches the action
    const confirmButton = page.locator('div[role="dialog"]').getByRole('button', { name: /Ativar|Desativar/i });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Verify status change
    await expect(page.getByText('Status do ficheiro alterado com sucesso!')).toBeVisible();
    const newStatus = await fileRow.locator('span.rounded-full').innerText();
    expect(newStatus).not.toBe(initialStatus);

    // 5. Delete File
    await fileRow.getByRole('button', { name: 'Apagar' }).click();
    
    // Confirm in dialog
    await page.locator('div[role="dialog"]').getByRole('button', { name: 'Apagar' }).click();
    
    // Verify deletion
    await expect(page.getByText('Ficheiro apagado com sucesso!')).toBeVisible();

  });
});
