
import fs from 'fs';
const path = 'tests/e2e/admin-partner-actions.spec.js';
let content = fs.readFileSync(path, 'utf8');

// Fix corrupted characters
content = content.replace(/autenticaÃ§Ã£o/g, 'autenticação');
content = content.replace(/pÃ¡gina/g, 'página');
content = content.replace(/DocumentaÃ§Ã£o/g, 'Documentação');
content = content.replace(/â€”/g, '—');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed characters in admin-partner-actions.spec.js');
