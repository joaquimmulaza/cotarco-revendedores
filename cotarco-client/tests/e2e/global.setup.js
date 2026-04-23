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

    // Diagnóstico: Verificar se a API está disponível na porta 8001
    console.log('[PRE-TEST] Verificando disponibilidade da API na porta 8001...');
    try {
      const response = await fetch('http://127.0.0.1:8001/api/test').catch(() => null);
      if (response && response.ok) {
        console.log('[PRE-TEST] API está ONLINE e respondendo na porta 8001.');
      } else {
        console.warn('[PRE-TEST] AVISO: API não respondeu em /api/test na porta 8001. Isto pode causar falhas nos testes.');
      }
    } catch (e) {
      console.warn('[PRE-TEST] AVISO: Falha ao tentar contactar a API na porta 8001.');
    }
  } catch (error) {
    console.error(`[PRE-TEST] ERRO CRÍTICO ao preparar a base de dados ${dbName}:`, error);
    process.exit(1);
  }
}

export default globalSetup;
