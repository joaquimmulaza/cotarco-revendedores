import { execSync } from 'child_process';

async function globalSetup() {
  const dbName = 'cotarco_revendedores_test';
  console.log(`\n[PRE-TEST] Preparando a base de dados de teste: ${dbName}...`);
  
  try {
    // Garantir que estamos a usar a base de dados de teste e o ambiente de testing
    const command = `npx cross-env APP_ENV=testing DB_DATABASE=${dbName} php artisan migrate:fresh --seed`;
    
    console.log(`[PRE-TEST] Executando: ${command}`);
    
    execSync(command, {
      stdio: 'inherit',
      cwd: 'c:/cotarco-revendedores/cotarco-api'
    });
    
    console.log(`[PRE-TEST] Base de dados ${dbName} resetada e semeada com sucesso.\n`);
  } catch (error) {
    console.error(`[PRE-TEST] ERRO CRÍTICO ao preparar a base de dados ${dbName}:`, error);
    process.exit(1);
  }
}

export default globalSetup;
