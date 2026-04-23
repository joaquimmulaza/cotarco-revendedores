
$filePath = 'tests/e2e/admin-partner-actions.spec.js'
$content = Get-Content -Path $filePath -Raw

# Replace locators
$content = $content -replace "page\.getByRole\('tab', { name: /Pendentes/ }\)\.click\(\);", "page.getByTestId('partner-tab-pending_approval').click();"
$content = $content -replace "page\.getByRole\('tab', { name: /Ativos/ }\)\.click\(\);", "page.getByTestId('partner-tab-active').click();"
$content = $content -replace "page\.getByPlaceholder\('Pesquisar por nome, email ou empresa\.\.\.'\)", "page.getByTestId('partner-search-input')"
$content = $content -replace "page\.getByRole\('dialog'\)\.getByRole\('button', { name: 'Aprovar' }\)", "page.getByTestId('modal-confirm-btn')"
$content = $content -replace "page\.getByRole\('dialog'\)\.getByRole\('button', { name: 'Desativar' }\)", "page.getByTestId('modal-confirm-btn')"
$content = $content -replace "page\.locator\('li\[data-sonner-toast\]'\)", "page.getByTestId('toast-container').locator('li')"
$content = $content -replace "page\.getByRole\('dialog'\)", "page.getByTestId('modal-container')"

# Special case for rejection test which has a more complex dialog locator chain
$content = $content -replace "const dialog = page\.getByRole\('dialog'\);", ""
$content = $content -replace "const rejectButton = dialog\.getByRole\('button', { name: 'Rejeitar' }\);", "const rejectButton = page.getByTestId('modal-confirm-btn');"
$content = $content -replace "await dialog\.locator\('#rejection-reason'\)\.fill", "await page.locator('#rejection-reason').fill"
$content = $content -replace "await expect\(dialog\)\.not\.toBeVisible", "await expect(page.getByTestId('modal-container')).not.toBeVisible"

Set-Content -Path $filePath -Value $content -Encoding UTF8
