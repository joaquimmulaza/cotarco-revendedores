<x-mail::message>
# Olá,

Obrigado pela sua encomenda na Cotarco.

**Valor Total:** {{ $order->total_amount }} Kz

**Detalhes de Pagamento:**
- **Entidade:** {{ $paymentDetails['entidade'] }}
- **Referência:** {{ $paymentDetails['referencia'] }}
- **Valor:** {{ $paymentDetails['valor'] }} Kz

Pode acompanhar o estado da sua encomenda no nosso site.

Obrigado,
<br>
{{ config('app.name') }}
</x-mail::message>
