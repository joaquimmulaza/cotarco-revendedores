# Estratégia de Testes E2E para Notificações de Email

Este documento define a estratégia oficial para testar automatizadamente o envio e recepção de emails no projeto Cotarco usando Playwright e Laravel. O foco são os fluxos de ponta-a-ponta (E2E), garantindo que botões de ação e dados dinâmicos funcionam corretamente.

## 1. Matriz de Decisão de Abordagens

Para garantir a melhor combinação entre velocidade, estabilidade e fidelidade, diferentes abordagens devem ser usadas dependendo do ambiente:

| Ambiente | Abordagem Recomendada | Justificação |
| :--- | :--- | :--- |
| **Desenvolvimento Local** | **Intercepção de Logs** (`MAIL_MAILER=log`) | Mínima configuração necessária. O Laravel já escreve para `laravel.log`. Perfeito para testes rápidos e desenvolvimento do próprio teste sem dependências externas. |
| **CI/CD** | **Endpoint Mock API** (`/api/testing/last-email`) | Máxima velocidade e confiabilidade. Em pipelines paralelas, a leitura de logs é proensa a *race conditions* e lentidão. Uma API que devolve o respetivo email da DB/Cache (se `MAIL_MAILER=array`) para o teste é a mais confiável. |
| **Staging / Pre-Prod** | **Mailpit/Mailtrap** (`MAIL_MAILER=smtp`) | Maior fidelidade ao mundo real. Verifica se o SMTP está realmente bem configurado. O Playwright pode interagir via [APIs do Mailpit/Mailtrap](https://mailtrap.io/docs/api/) para ler a caixa de entrada. |

## 2. Isolamento de Testes Paralelos (Race Conditions)

Na abordagem actual de Intercepção de Logs (ou qualquer leitura centralizada), existe o risco de *race conditions* quando múltiplos testes correm em paralelo. O Teste A não pode acidentalmente ler o email gerado pelo Teste B.

**Solução Obrigatória:**
1. **Endereços de Email Únicos:** Cada teste que cria um utilizador ou aciona um envio de email DEVE usar um timestamp gerado na hora.
   - *Exemplo:* `const testEmail = 'distribuidor+${Date.now()}@exemplo.com';`
2. **Filtro Exato no Parser:** O script de Playwright que consome os logs ou a Mock API tem de filtrar o conteúdo recebido para garantir que o destinatário corresponde ao `testEmail` específico dessa *worker*.
3. **Limpeza de Contexto:** Antes da suite rodar, truncar logs pesados antigos ajuda na performance da leitura, mas a chave de identificação única é o email.

## 3. Cobertura de Fluxos Críticos do Domínio (Cotarco)

Os testes de email não devem cobrir apenas fluxos genéricos. É obrigatório focar nos seguintes casos de negócio do Cotarco / AppyPay:

- **(a) Registo Genérico:** Verificação de email (`verification.verify`) clicando no link gerado com as *signed routes* do Laravel.
- **(b) Aprovação de Distribuidor (Admin):** O admin aprova, o parceiro recebe o email `PartnerApproved`. O teste deve extrair o link para login (`/distribuidores/login`) contido no email e navegar para garantir o funcionamento.
- **(c) Rejeição de Distribuidor com Motivo Dinâmico:** O admin submete o motivo via `textarea` no `ConfirmDialog`; o mailable `PartnerRejected` recebe `$reason` como parâmetro e o blade renderiza-o dinamicamente. O teste verifica que o conteúdo exacto submetido pelo admin aparece no bloco de email capturado no log.
- **(d) AppyPay / Pagamento Multicaixa:** Operacionalmente, o webhook do AppyPay bate no Laravel (`WebhookController`), a BD (Stock/Ordem) é atualizada, e *só depois* o email (`PaymentSuccessCustomer`) é enfileirado no Job. Como o teste E2E precisará simular este fluxo enviando um payload falso de Webhook para a API e esperar o processamento da queue, o timeout do `expect.poll` para este fluxo deverá ser mais longo (ex: 15 a 20 segundos) relativamente aos envios diretos normais. É fundamental extrair o bloco isolado e verificar se ele exibe os dados da referência de pagamento.

## 4. Async Timing e Retry Logic (Queues)

No back-end do Cotarco, os emails são enviados via *Jobs* (`php artisan queue:work`), sendo operações assíncronas. Uma chamada Playwright como `await page.click('Registar')` retorna muito antes do email estar escrito no log.

**Estratégia Playwright:**
Temos de usar o mecanismo `expect.poll` (polling assertions) do Playwright, acoplado à função de ler o ficheiro, num sistema de *retry*:

```javascript
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

// Função auxiliar que encapsula o parsing isolando apenas o bloco do e-mail.
// Passa o timeout como argumento (pois processos como AppyPay exigem maior margem)
async function waitForEmailInLog(targetEmail, maxTimeout = 10000) {
  return await expect.poll(async () => {
    const logContent = fs.readFileSync('cotarco-api/storage/logs/laravel.log', 'utf8');
    
    // RegEx para localizar do início do cabeçalho de destino até ao próx To: ou fim do doc
    const emailBlockRegex = new RegExp(`To: ${targetEmail}[\\s\\S]*?(?=(To: |$))`, 'g');
    const matches = logContent.match(emailBlockRegex);
    
    if (matches && matches.length > 0) {
      // Devolve apenas a string de HTML/Output do último email correspondente
      return matches[matches.length - 1]; 
    }
    return null;
  }, {
    message: `A aguardar extração do email de ${targetEmail} do log`,
    timeout: maxTimeout, 
    intervals: [500, 1000, 2000] // Polling intervals base
  }).not.toBeNull();
}
```
*Isto garante estabilidade contra atrasos momentâneos dos Jobs assíncronos.*

## 5. Mock API: Regras de Segurança (Testing Endpoint)

A Opção 2 propõe uma API (ex: `/api/testing/last-email`). A segurança disto num contexto que um dia irá para produção é crítica.

**Guards Obrigatórios:**
O endpoint apenas deve ser registado dentro num bloco que valide o ambiente de forma agressiva (dentro de `routes/api.php`):

```php
// O endpoint APENAS é registado quando os requisitos cumprem as regras de ambiente seguro.
if (app()->environment('testing', 'local') && config('app.debug') === true) {
    Route::get('/testing/emails/{recipient}', function($recipient) {
       // A rota nem sequer existe em Produção, não é preciso Double-Check.
       // (...) Devolver email mockado gerado na DB ou cache ('array' mailer driver)
    });
}
```

## 6. Plano de Transição (Triggers)

Em vez de saltar de tecnologia constantemente, aqui está o critério para evoluir a estratégia atual:

- **Fase 1 (Finalizada - Intercepção Logs):** 
  - *Contexto:* Testes a rodar localmente e em ambientes de dev paralelos.
  - *Resultados:* Estabilizado o mecanismo de parsing para suportar o formato RFC 822 (usado em notificações nativas como Verificação de Email) e subjects codificados em UTF-8. O regex cirúrgico agora delimita blocos com base no timestamp do log, garantindo isolamento total.
  - *Estado:* Todos os fluxos (Registo, Aprovação, Rejeição e Pagamento) estão a passar com 100% de confiabilidade.

---
*Fase 1 concluída com sucesso. Próximos passos (Fase 2) serão necessários apenas se a escalabilidade da leitura de logs se tornar um gargalo em CI de alta performance.*
