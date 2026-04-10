import { execSync } from 'child_process';

async function globalSetup() {
  console.log('Preparando a base de dados de teste...');
  try {
    execSync('npx cross-env APP_ENV=testing DB_DATABASE=cotarco_revendedores_test php artisan migrate:fresh --seed', {
      stdio: 'inherit',
      cwd: 'c:/cotarco-revendedores/cotarco-api'
    });
    console.log('Base de dados de teste pronta.');
  } catch (error) {
    console.error('Falha ao preparar a base de dados de teste:', error);
    process.exit(1);
  }
}

export default globalSetup;
