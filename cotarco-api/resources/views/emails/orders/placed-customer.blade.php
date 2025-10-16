<x-mail::message>
# Olá,

Agradecemos a sua encomenda.

**Detalhes de Pagamento:**
- **Entidade:** {{ $paymentDetails['entidade'] }}
- **Referência:** {{ $paymentDetails['referencia'] }}
- **Valor:** {{ $paymentDetails['valor'] }} Kz

Assim que o pagamento for confirmado, daremos continuidade ao processamento da sua encomenda.

Atenciosamente,
<br>
{{ config('app.name') }}
</x-mail::message>
