<x-mail::message>
# Pagamento Confirmado

Olá,

Obrigado pelo seu pagamento. A sua encomenda #{{ $order->id }} está agora em processamento.

Pode acompanhar o estado da sua encomenda no nosso site.

Obrigado,
<br>
{{ config('app.name') }}
</x-mail::message>
