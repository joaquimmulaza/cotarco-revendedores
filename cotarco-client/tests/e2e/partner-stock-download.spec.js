import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const partnerState = 'playwright/.auth/partner.json'; // Partner storage state

test.describe('Partner Stock Map Download', () => {

  test.use({ storageState: partnerState });

  test('partner should be able to download the active stock map', async ({ page }) => {
    console.log('Navigating to stock map page...');
    
    // Navegar para a rota de stock
    await page.goto('/distribuidores/stock');

    // Locators para os 3 estados possíveis
    const successHeading = page.getByRole('heading', { name: /Mapas de Stock Disponíveis/i });
    const emptyHeading   = page.getByRole('heading', { name: /Mapa de Stock Não Disponível/i });
    const errorHeading   = page.getByRole('heading', { name: /Erro ao carregar informações/i });

    console.log('Waiting for component to load (checking for success, empty or error state)...');

    // Esperar que um dos estados apareça na página
    // Usamos um timeout generoso porque a API pode demorar
    await expect(async () => {
      const isSuccess = await successHeading.isVisible();
      const isEmpty   = await emptyHeading.isVisible();
      const isError   = await errorHeading.isVisible();
      expect(isSuccess || isEmpty || isError).toBeTruthy();
    }).toPass({
      timeout: 30000,
      intervals: [500, 1000, 2000]
    });

    // Validar qual o estado que apareceu
    if (await errorHeading.isVisible()) {
      throw new Error('StockFileDownloader mostrou erro — verifique se a API /parceiro/stock-files está disponível.');
    }

    if (await emptyHeading.isVisible()) {
      console.log('Aviso: Nenhum ficheiro de stock disponível no momento.');
      // O teste passa se o componente renderizar o estado "vazio" corretamente
      return;
    }

    // Se chegou aqui, o successHeading está visível
    console.log('Estado de sucesso detectado: Ficheiros de stock disponíveis.');
    
    // Encontrar o botão de download
    const downloadButton = page.getByRole('button', { name: /Baixar Agora/i }).first();
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();

    console.log('Iniciando download...');
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    console.log(`Download concluído: ${filename}`);
    
    // Verificar se o ficheiro tem extensão .xlsx ou .csv ou .pdf (o componente suporta o que a API devolver)
    expect(filename).toMatch(/\.(xlsx|csv|pdf)$/i);
  });
});
