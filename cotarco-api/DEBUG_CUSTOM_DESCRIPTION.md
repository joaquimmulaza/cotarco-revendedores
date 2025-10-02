# Debug - Custom Description Functionality

## Rota de Teste Adicionada

Foi adicionada uma rota de teste temporária para debug da funcionalidade `custom_description`:

```
GET /api/test-product/{id}
```

### Como Usar

1. **Encontrar um ID de produto no WordPress:**
   - Acesse o painel admin do WordPress
   - Vá para WooCommerce > Produtos
   - Encontre um produto que tenha um iframe no campo de metadados `_wpcode_page_scripts_footer`
   - Anote o ID do produto

2. **Testar a rota:**
   ```bash
   # Exemplo com ID 123
   curl http://localhost:8000/api/test-product/123
   
   # Ou acesse diretamente no navegador:
   http://localhost:8000/api/test-product/123
   ```

3. **Verificar a resposta:**
   - A resposta deve incluir todos os dados do produto do WooCommerce
   - Deve ter um novo campo `custom_description` com o HTML limpo ou `null`

### O que a Rota Faz

1. Busca o produto específico da API do WooCommerce
2. Usa reflexão para chamar o método privado `fetchCustomDescription()`
3. Adiciona o campo `custom_description` aos dados do produto
4. Retorna a resposta completa em JSON

### Campos Relevantes para Debug

Na resposta JSON, procure por:

- **`meta_data`**: Array com todos os metadados do produto
  - Procure por `_wpcode_page_scripts_footer` com iframe
- **`custom_description`**: O novo campo com HTML limpo ou `null`

### Exemplo de Metadado com iframe:

```json
{
  "key": "_wpcode_page_scripts_footer",
  "value": "<iframe src=\"https://example.com/product-description\" width=\"100%\" height=\"400\"></iframe>"
}
```

### Possíveis Resultados:

1. **`custom_description: null`**: 
   - Produto não tem metadado `_wpcode_page_scripts_footer`
   - Metadado existe mas não contém iframe
   - Erro na requisição para a URL do iframe

2. **`custom_description: "...HTML..."`**:
   - Sucesso! HTML foi extraído e limpo
   - Elemento `#colophon` foi removido

### Logs de Debug

Verifique os logs do Laravel em `storage/logs/laravel.log` para mensagens de erro relacionadas a:
- Requisições HTTP falhadas
- Erros no processamento do HTML

### Limpeza

**IMPORTANTE**: Remova esta rota de teste quando terminar o debug, pois usa reflexão para acessar métodos privados.
