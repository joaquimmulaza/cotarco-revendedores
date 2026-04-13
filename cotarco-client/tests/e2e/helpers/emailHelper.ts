import { expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Aguarda e extrai o bloco de email do log do Laravel para um destinatário específico.
 *
 * Lê o ficheiro `storage/logs/laravel.log` na diretoria da API usando polling com retry,
 * garantindo estabilidade contra atrasos dos Jobs assíncronos de email (Queue).
 *
 * @param targetEmail - O endereço de email a filtrar (ex: 'distribuidor+1234567890@exemplo.com')
 * @param maxTimeout  - Timeout máximo em ms (padrão: 20000ms).
 * @returns A string do bloco do último email encontrado no log correspondente ao destinatário.
 */
export async function waitForEmailInLog(targetEmail: string, maxTimeout = 20000): Promise<string> {
  const logPath = path.resolve(process.cwd(), '..', 'cotarco-api', 'storage', 'logs', 'laravel.log');
  let foundBlock: string | null = null;

  await expect.poll(async () => {
    if (!fs.existsSync(logPath)) {
      return false;
    }
    // Carregar conteúdo do log
    const logContent = fs.readFileSync(logPath, 'utf8');

    // Escapar caracteres especiais (como o +) para procura literal
    const escapedEmail = targetEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    /**
     * RegEx Cirúrgico e Robusto:
     * 1. (?:\r?\n|^)To:[ \t]* -> Garante que To: está no início da linha (suporta \r\n ou \n)
     * 2. .*${escapedEmail}     -> Procura o email na mesma linha (suporta "Nome <email>")
     * 3. [\s\S]*?              -> Captura o conteúdo de forma não-gananciosa
     * 4. (?=\r?\n\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]|$) -> Delimita no início de uma NOVA entrada de log Completa ou fim do ficheiro
     */
    const emailBlockRegex = new RegExp(`(?:\\r?\\n|^)To:[ \\t]*.*${escapedEmail}[\\s\\S]*?(?=\\r?\\n\\[\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\]|$)`, 'gi');
    const matches = logContent.match(emailBlockRegex);

    if (matches && matches.length > 0) {
      foundBlock = matches[matches.length - 1];
      return true;
    }
    
    return false;
  }, {
    message: `A aguardar extração do email de ${targetEmail} no log em ${logPath}`,
    timeout: maxTimeout,
    intervals: [500, 1000, 2000], 
  }).toBeTruthy();

  return foundBlock!;
}

/**
 * Extrai o URL assinado de verificação de email de um bloco de log de email.
 *
 * Procura por URLs que contenham o padrão da signed route de verificação do Laravel:
 * `/api/email/verify/{id}/{hash}?expires=...&signature=...`
 *
 * @param emailBlock - A string do bloco de email retornada por `waitForEmailInLog`.
 * @returns O URL de verificação completo, ou `null` se não encontrado.
 */
export function extractVerificationUrl(emailBlock: string): string | null {
  // Captura o URL completo da signed route de verificação do Laravel
  const urlMatch = emailBlock.match(/https?:\/\/\S*\/api\/email\/verify\/[^\s"<>]+/);
  return urlMatch ? urlMatch[0] : null;
}

/**
 * Extrai o URL de login do distribuidor de um bloco de email PartnerApproved ou PartnerReactivated.
 *
 * O Laravel injeta $loginUrl (frontend_url + '/login') no template como href de um botão CTA.
 *
 * @param emailBlock - A string do bloco de email retornada por `waitForEmailInLog`.
 * @returns O URL de login completo, ou `null` se não encontrado.
 */
export function extractLoginUrl(emailBlock: string): string | null {
  // Captura href que contenha /login (ancorado ao fim do path para evitar /admin/login)
  const urlMatch = emailBlock.match(/https?:\/\/[^\s"<>]+\/login(?:[?#][^\s"<>]*)?/);
  return urlMatch ? urlMatch[0] : null;
}
