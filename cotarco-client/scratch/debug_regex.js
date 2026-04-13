
import * as fs from 'fs';
import * as path from 'path';

const logPath = 'c:/cotarco-revendedores/cotarco-api/storage/logs/laravel.log';
const targetEmail = 'distribuidor+1775824636331@exemplo.com'; // Exemplo que vimos no log

if (!fs.existsSync(logPath)) {
    console.error('Log file not found');
    process.exit(1);
}

const logContent = fs.readFileSync(logPath, 'utf8');
const escapedEmail = targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Regex 1: Antiga (estrita)
const regexOld = new RegExp(`To: ${escapedEmail}[\\s\\S]*?(?=(To: |$))`, 'g');
const matchesOld = logContent.match(regexOld);

// Regex 2: Nova (flexível)
const regexNew = new RegExp(`To: .*${escapedEmail}[\\s\\S]*?(?=\\n\\[\\d{4}-\\d{2}-\\d{2}|$)`, 'gi');
const matchesNew = logContent.match(regexNew);

console.log('--- Debug Regex ---');
console.log('Target Email:', targetEmail);
console.log('Escaped Email:', escapedEmail);
console.log('Matches Old:', matchesOld ? matchesOld.length : 0);
console.log('Matches New:', matchesNew ? matchesNew.length : 0);

if (matchesNew && matchesNew.length > 0) {
    console.log('Last Match New (first 100 chars):');
    console.log(matchesNew[matchesNew.length - 1].substring(0, 500));
}
